FROM node

# Copy app to work
COPY . /work
WORKDIR /work

# Install prerequirements
RUN npm install -g @ionic/cli
RUN npm install

# Build app
RUN ionic build

EXPOSE 8100
EXPOSE 8060


# Use for production
#CMD ionic serve --host=0.0.0.0 --port=8060

# Use for developing
CMD ./install_and_run.sh