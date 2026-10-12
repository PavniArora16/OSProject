
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include "event_logger.h"

#define NUM_READERS 5
#define NUM_WRITERS 2

int shared_data = 0;
int active_readers = 0;

pthread_mutex_t reader_mutex;
pthread_mutex_t resource_mutex;

void log_rw_event(
    const char *event_name,
    int thread_id,
    int value
)
{
    char event[256];

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"%s\",\"thread_id\":%d,\"value\":%d}",
        event_name,
        thread_id,
        value
    );

    log_event(event);
}

void *reader(void *arg)
{
    int id = *(int *)arg;
    int value;

    /*
     * Update the reader count safely.
     * The first reader locks the shared resource.
     */
    pthread_mutex_lock(&reader_mutex);

    active_readers++;

    if (active_readers == 1) {
        pthread_mutex_lock(&resource_mutex);
    }

    log_rw_event("reader_started", id, active_readers);

    pthread_mutex_unlock(&reader_mutex);

    /* Read the shared resource while protected from writers. */
    value = shared_data;

    log_rw_event("data_read", id, value);

    usleep(100000);

    pthread_mutex_lock(&reader_mutex);

    active_readers--;

    log_rw_event("reader_finished", id, active_readers);

    /* The last reader releases the resource for writers. */
    if (active_readers == 0) {
        pthread_mutex_unlock(&resource_mutex);
    }

    pthread_mutex_unlock(&reader_mutex);

    return NULL;
}

void *writer(void *arg)
{
    int id = *(int *)arg;

    /* Only one writer can access the resource at a time. */
    pthread_mutex_lock(&resource_mutex);

    shared_data++;

    log_rw_event("writer_started", id, shared_data);

    usleep(150000);

    log_rw_event("data_written", id, shared_data);

    log_rw_event("writer_finished", id, shared_data);

    pthread_mutex_unlock(&resource_mutex);

    return NULL;
}

int main(void)
{
    pthread_t readers[NUM_READERS];
    pthread_t writers[NUM_WRITERS];

    int reader_ids[NUM_READERS];
    int writer_ids[NUM_WRITERS];

    char event[256];

    pthread_mutex_init(&reader_mutex, NULL);
    pthread_mutex_init(&resource_mutex, NULL);

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_started\","
        "\"problem\":\"readers_writers\","
        "\"readers\":%d,\"writers\":%d}",
        NUM_READERS,
        NUM_WRITERS
    );

    log_event(event);

    /* Create readers and writers. */
    for (int i = 0; i < NUM_READERS; i++) {
        reader_ids[i] = i + 1;

        if (pthread_create(
                &readers[i],
                NULL,
                reader,
                &reader_ids[i]) != 0) {
            perror("pthread_create reader");
            return 1;
        }
    }

    for (int i = 0; i < NUM_WRITERS; i++) {
        writer_ids[i] = i + 1;

        if (pthread_create(
                &writers[i],
                NULL,
                writer,
                &writer_ids[i]) != 0) {
            perror("pthread_create writer");
            return 1;
        }
    }

    /* Wait for every thread to finish. */
    for (int i = 0; i < NUM_READERS; i++) {
        pthread_join(readers[i], NULL);
    }

    for (int i = 0; i < NUM_WRITERS; i++) {
        pthread_join(writers[i], NULL);
    }

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_completed\","
        "\"problem\":\"readers_writers\","
        "\"final_value\":%d}",
        shared_data
    );

    log_event(event);

    pthread_mutex_destroy(&reader_mutex);
    pthread_mutex_destroy(&resource_mutex);

    return 0;
}
