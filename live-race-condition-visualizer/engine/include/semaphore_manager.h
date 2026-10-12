
#ifndef SEMAPHORE_MANAGER_H
#define SEMAPHORE_MANAGER_H

#include <semaphore.h>

int semaphore_manager_init(
    sem_t *semaphore,
    int initial_value
);

int semaphore_manager_wait(sem_t *semaphore);

int semaphore_manager_post(sem_t *semaphore);

int semaphore_manager_destroy(sem_t *semaphore);

#endif
