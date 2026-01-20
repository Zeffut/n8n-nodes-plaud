FROM n8nio/n8n:latest

USER root

# Create custom nodes directory
RUN mkdir -p /home/node/.n8n/custom/node_modules/n8n-nodes-plaud

# Copy the built node
COPY --chown=node:node dist/ /home/node/.n8n/custom/node_modules/n8n-nodes-plaud/dist/
COPY --chown=node:node package.json /home/node/.n8n/custom/node_modules/n8n-nodes-plaud/

USER node

ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
