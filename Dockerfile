# Use an official Node.js runtime as the base image
FROM node:14

# Set the PORT environment variable to 3001
ENV PORT=3001

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Copy the entrypoint script into the container
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Expose the port your app runs on
EXPOSE 3001

# Command to run your application
CMD ["node", "app.js"]
