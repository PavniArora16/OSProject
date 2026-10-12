
#include <errno.h>
#include "semaphore_manager.h"

int semaphore_manager_init(sem_t *semaphore, int initial_value)
{
    return sem_init(semaphore, 0, (unsigned int)initial_value);
}

int semaphore_manager_wait(sem_t *semaphore)
{
    int result;

    do {
        result = sem_wait(semaphore);
    } while (result == -1 && errno == EINTR);

    return result;
}

int semaphore_manager_post(sem_t *semaphore)
{
    return sem_post(semaphore);
}

int semaphore_manager_destroy(sem_t *semaphore)
{
    return sem_destroy(semaphore);
}
