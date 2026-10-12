
CC = gcc
CFLAGS = -Wall -Wextra -pthread -Iinclude

BIN_DIR = bin
SRC_DIR = src
PROBLEM_DIR = $(SRC_DIR)/problems

COMMON = $(SRC_DIR)/event_logger.c

PROGRAMS = shared_counter producer_consumer dining_philosophers readers_writers

all: $(PROGRAMS)

shared_counter: $(PROBLEM_DIR)/shared_counter.c $(COMMON)
	$(CC) $(CFLAGS) $^ -o $(BIN_DIR)/$@

producer_consumer: $(PROBLEM_DIR)/producer_consumer.c $(COMMON) $(SRC_DIR)/semaphore_manager.c
	$(CC) $(CFLAGS) $^ -o $(BIN_DIR)/$@

dining_philosophers: $(PROBLEM_DIR)/dining_philosophers.c $(COMMON)
	$(CC) $(CFLAGS) $^ -o $(BIN_DIR)/$@

readers_writers: $(PROBLEM_DIR)/readers_writers.c $(COMMON)
	$(CC) $(CFLAGS) $^ -o $(BIN_DIR)/$@

clean:
	rm -f $(BIN_DIR)/shared_counter
	rm -f $(BIN_DIR)/producer_consumer
	rm -f $(BIN_DIR)/dining_philosophers
	rm -f $(BIN_DIR)/readers_writers

.PHONY: all clean
