
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>
#include "event_logger.h"

#define NUM_PHILOSOPHERS 5

pthread_mutex_t forks[NUM_PHILOSOPHERS];
pthread_barrier_t start_barrier;

int prevention_mode = 0;

struct Philosopher {
    int id;
};

void log_philosopher_event(
    const char *event_name,
    int philosopher_id,
    int fork_id
)
{
    char event[256];

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"%s\","
        "\"philosopher\":%d,\"fork\":%d}",
        event_name,
        philosopher_id,
        fork_id
    );

    log_event(event);
}

void *philosopher(void *arg)
{
    struct Philosopher *p = (struct Philosopher *)arg;

    int id = p->id;
    int left_fork = id;
    int right_fork = (id + 1) % NUM_PHILOSOPHERS;

    log_philosopher_event("philosopher_thinking", id, -1);

    /*
     * Make all philosophers reach the fork-acquisition stage
     * before any of them tries to acquire a fork.
     */
    pthread_barrier_wait(&start_barrier);

    if (prevention_mode) {
        /*
         * Prevention: acquire the lower-numbered fork first.
         * This global ordering prevents circular wait.
         */
        int first = left_fork < right_fork
                    ? left_fork : right_fork;
        int second = left_fork < right_fork
                     ? right_fork : left_fork;

        pthread_mutex_lock(&forks[first]);
        log_philosopher_event("fork_acquired", id, first);

        pthread_mutex_lock(&forks[second]);
        log_philosopher_event("fork_acquired", id, second);
    } else {
        /*
         * Demonstration: acquire left first, then right.
         * A barrier makes every philosopher hold one fork
         * before attempting the second, creating deadlock.
         */
        
        pthread_mutex_lock(&forks[left_fork]);
        log_philosopher_event("fork_acquired", id, left_fork);

        /*
        * Wait until every philosopher holds their left fork.
        * Each philosopher holds one fork while waiting here.
        */
        pthread_barrier_wait(&start_barrier);

        log_philosopher_event("waiting_for_fork", id, right_fork);

        pthread_mutex_lock(&forks[right_fork]);

        log_philosopher_event("fork_acquired", id, right_fork);
    }

    log_philosopher_event("philosopher_eating", id, -1);

    usleep(100000);

    pthread_mutex_unlock(&forks[left_fork]);
    pthread_mutex_unlock(&forks[right_fork]);

    log_philosopher_event("philosopher_finished", id, -1);

    return NULL;
}

int main(int argc, char *argv[])
{
    pthread_t threads[NUM_PHILOSOPHERS];
    struct Philosopher philosophers[NUM_PHILOSOPHERS];
    char event[256];

    if (argc != 2 ||
        (atoi(argv[1]) != 0 && atoi(argv[1]) != 1)) {
        fprintf(stderr, "Usage: %s <0|1>\n", argv[0]);
        fprintf(stderr, "0 = deadlock demonstration\n");
        fprintf(stderr, "1 = deadlock prevention\n");
        return 1;
    }

    prevention_mode = atoi(argv[1]);

    for (int i = 0; i < NUM_PHILOSOPHERS; i++) {
        if (pthread_mutex_init(&forks[i], NULL) != 0) {
            fprintf(stderr, "Failed to initialize fork %d\n", i);
            return 1;
        }
    }

    if (pthread_barrier_init(
            &start_barrier, NULL, NUM_PHILOSOPHERS) != 0) {
        fprintf(stderr, "Failed to initialize barrier\n");
        return 1;
    }

    snprintf(
        event,
        sizeof(event),
        "{\"event\":\"simulation_started\","
        "\"problem\":\"dining_philosophers\","
        "\"philosophers\":%d,\"mode\":\"%s\"}",
        NUM_PHILOSOPHERS,
        prevention_mode ? "prevention" : "deadlock"
    );

    log_event(event);

    for (int i = 0; i < NUM_PHILOSOPHERS; i++) {
        philosophers[i].id = i;

        if (pthread_create(
                &threads[i],
                NULL,
                philosopher,
                &philosophers[i]) != 0) {
            fprintf(stderr, "Failed to create philosopher %d\n", i);
            return 1;
        }
    }

    /*
     * Prevention mode should finish normally.
     * Deadlock mode can remain blocked by design.
     */
    if (prevention_mode) {
        for (int i = 0; i < NUM_PHILOSOPHERS; i++) {
            pthread_join(threads[i], NULL);
        }

        snprintf(
            event,
            sizeof(event),
            "{\"event\":\"simulation_completed\","
            "\"problem\":\"dining_philosophers\","
            "\"mode\":\"prevention\"}"
        );

        log_event(event);

        pthread_barrier_destroy(&start_barrier);

        for (int i = 0; i < NUM_PHILOSOPHERS; i++) {
            pthread_mutex_destroy(&forks[i]);
        }

        return 0;
    }

    /*
     * Deadlock demonstration mode: wait briefly so events
     * can be observed, then exit the process without waiting
     * for philosophers that are intentionally deadlocked.
     */
    sleep(3);

    log_event(
        "{\"event\":\"deadlock_observed\","
        "\"message\":\"Philosophers may be waiting indefinitely\"}"
    );

    _Exit(0);
}
