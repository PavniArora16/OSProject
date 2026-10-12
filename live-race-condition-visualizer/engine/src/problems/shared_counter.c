
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include "event_logger.h"

#define NUM_THREADS 4
#define INCREMENTS 100000

long long counter = 0;
int use_mutex = 0;

pthread_mutex_t counter_mutex;

void *increment_counter(void *arg)
{
    int thread_id = *(int *)arg;
    char event[128];

    for (int i = 0; i < INCREMENTS; i++) {
        if (use_mutex) {
            pthread_mutex_lock(&counter_mutex);
            counter++;
            pthread_mutex_unlock(&counter_mutex);
        } else {
            counter++;
        }
    }

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"thread_completed\","
        "\"thread_id\":%d}",
        thread_id
    );

    log_event(event);

    return NULL;
}

int main(int argc, char *argv[])
{
    pthread_t threads[NUM_THREADS];
    int thread_ids[NUM_THREADS];
    char event[256];

    if (argc != 2 ||
        (atoi(argv[1]) != 0 && atoi(argv[1]) != 1)) {
        fprintf(stderr, "Usage: %s <0|1>\n", argv[0]);
        fprintf(stderr, "0 = race mode, 1 = mutex mode\n");
        return 1;
    }

    use_mutex = atoi(argv[1]);

    if (use_mutex) {
        if (pthread_mutex_init(&counter_mutex, NULL) != 0) {
            perror("pthread_mutex_init");
            return 1;
        }
    }

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_started\","
        "\"mode\":\"%s\",\"threads\":%d,"
        "\"increments_per_thread\":%d}",
        use_mutex ? "mutex" : "race",
        NUM_THREADS,
        INCREMENTS
    );

    log_event(event);

    for (int i = 0; i < NUM_THREADS; i++) {
        thread_ids[i] = i + 1;

        if (pthread_create(
                &threads[i],
                NULL,
                increment_counter,
                &thread_ids[i]) != 0) {
            perror("pthread_create");
            return 1;
        }
    }

    for (int i = 0; i < NUM_THREADS; i++) {
        pthread_join(threads[i], NULL);
    }

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_completed\","
        "\"mode\":\"%s\",\"final_counter\":%lld,"
        "\"expected_counter\":%d}",
        use_mutex ? "mutex" : "race",
        counter,
        NUM_THREADS * INCREMENTS
    );

    log_event(event);

    if (use_mutex) {
        pthread_mutex_destroy(&counter_mutex);
    }

    return 0;
}
