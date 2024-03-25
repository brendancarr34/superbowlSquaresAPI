#!/bin/bash

# Print a message indicating that the container is starting
echo "Container is starting..."

# Run any initialization tasks or commands here
# For example, you might set environment variables or start additional services

# Finally, execute the command provided as arguments to the script
exec "$@"
