
#include <stdio.h>
#include <pthread.h>
#include "event_logger.h"

static pthread_mutex_t log_mutex = PTHREAD_MUTEX_INITIALIZER;

void log_event(const char *event_json)
{
    pthread_mutex_lock(&log_mutex);

    printf("%s\n", event_json);
    fflush(stdout);

    pthread_mutex_unlock(&log_mutex);
}
