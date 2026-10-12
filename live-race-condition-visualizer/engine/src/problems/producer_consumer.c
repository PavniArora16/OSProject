
#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include "event_logger.h"
#include "semaphore_manager.h"

#define BUFFER_SIZE 5
#define TOTAL_ITEMS 20

int buffer[BUFFER_SIZE];
int in = 0;
int out = 0;
int produced_count = 0;
int consumed_count = 0;

pthread_mutex_t buffer_mutex;

sem_t empty_slots;
sem_t filled_slots;

void *producer(void *arg)
{
    (void)arg;

    for (int item = 1; item <= TOTAL_ITEMS; item++) {
        char event[256];

        if (semaphore_manager_wait(&empty_slots) == -1) {
            perror("sem_wait empty_slots");
            return NULL;
        }

        pthread_mutex_lock(&buffer_mutex);

        buffer[in] = item;
        in = (in + 1) % BUFFER_SIZE;
        produced_count++;

        snprintf(
            event,
            sizeof(event),
            "{\"event\":\"item_produced\","
            "\"item\":%d,\"produced_count\":%d}",
            item,
            produced_count
        );

        pthread_mutex_unlock(&buffer_mutex);

        log_event(event);

        if (semaphore_manager_post(&filled_slots) == -1) {
            perror("sem_post filled_slots");
            return NULL;
        }
    }

    return NULL;
}

void *consumer(void *arg)
{
    (void)arg;

    for (int i = 0; i < TOTAL_ITEMS; i++) {
        int item;
        char event[256];

        if (semaphore_manager_wait(&filled_slots) == -1) {
            perror("sem_wait filled_slots");
            return NULL;
        }

        pthread_mutex_lock(&buffer_mutex);

        item = buffer[out];
        out = (out + 1) % BUFFER_SIZE;
        consumed_count++;

        snprintf(
            event,
            sizeof(event),
            "{\"event\":\"item_consumed\","
            "\"item\":%d,\"consumed_count\":%d}",
            item,
            consumed_count
        );

        pthread_mutex_unlock(&buffer_mutex);

        log_event(event);

        if (semaphore_manager_post(&empty_slots) == -1) {
            perror("sem_post empty_slots");
            return NULL;
        }
    }

    return NULL;
}

int main(void)
{
    pthread_t producer_thread;
    pthread_t consumer_thread;
    char event[256];

    if (pthread_mutex_init(&buffer_mutex, NULL) != 0) {
        fprintf(stderr, "Failed to initialize buffer mutex\n");
        return 1;
    }

    if (semaphore_manager_init(&empty_slots, BUFFER_SIZE) == -1) {
        perror("sem_init empty_slots");
        pthread_mutex_destroy(&buffer_mutex);
        return 1;
    }

    if (semaphore_manager_init(&filled_slots, 0) == -1) {
        perror("sem_init filled_slots");
        semaphore_manager_destroy(&empty_slots);
        pthread_mutex_destroy(&buffer_mutex);
        return 1;
    }

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_started\","
        "\"problem\":\"producer_consumer\","
        "\"buffer_size\":%d,\"total_items\":%d}",
        BUFFER_SIZE,
        TOTAL_ITEMS
    );
    log_event(event);

    if (pthread_create(
            &producer_thread, NULL, producer, NULL) != 0) {
        fprintf(stderr, "Failed to create producer thread\n");
        semaphore_manager_destroy(&filled_slots);
        semaphore_manager_destroy(&empty_slots);
        pthread_mutex_destroy(&buffer_mutex);
        return 1;
    }

    if (pthread_create(
            &consumer_thread, NULL, consumer, NULL) != 0) {
        fprintf(stderr, "Failed to create consumer thread\n");

        /*
         * The producer may be waiting because the buffer is full.
         * Wake it so it can finish before cleanup.
         */
        semaphore_manager_post(&empty_slots);
        pthread_join(producer_thread, NULL);

        semaphore_manager_destroy(&filled_slots);
        semaphore_manager_destroy(&empty_slots);
        pthread_mutex_destroy(&buffer_mutex);
        return 1;
    }

    pthread_join(producer_thread, NULL);
    pthread_join(consumer_thread, NULL);

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_completed\","
        "\"problem\":\"producer_consumer\","
        "\"produced\":%d,\"consumed\":%d}",
        produced_count,
        consumed_count
    );
    log_event(event);

    semaphore_manager_destroy(&filled_slots);
    semaphore_manager_destroy(&empty_slots);
    pthread_mutex_destroy(&buffer_mutex);

    return 0;
}
