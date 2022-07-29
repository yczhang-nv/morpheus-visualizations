ARG BASE_IMAGE=ghcr.io/rapidsai/node:22.06.00-devel-node16.15.1-cuda11.6.2-ubuntu20.04

FROM ${BASE_IMAGE}-main as base

# Change the shell from a login shell (otherwise apt doesnt work)
SHELL [ "/bin/bash", "-c" ]

USER root

# Install libgtx-3-0
RUN apt update &&\
    apt install -y libgtk-3-0 git &&\
    apt autoremove -y && apt clean &&\
    rm -rf \
      /tmp/* \
      /var/tmp/* \
      /var/cache/apt/* \
      /var/lib/apt/lists/*

USER rapids

# Force packages to be downloaded
ENV RAPIDSAI_SKIP_DOWNLOAD=0

FROM ${BASE_IMAGE}-packages as packages

# Create a new stage to build/run inside the container
FROM base as build

# Copy the source over
COPY --chown=rapids:rapids ./ /opt/rapids/viz

# Copy the packages over
COPY --from=packages --chown=rapids:rapids [ \
      "/opt/rapids/rapidsai-core-22.6.0.tgz", \
      "/opt/rapids/rapidsai-cuda-22.6.0.tgz", \
      "/opt/rapids/rapidsai-rmm-22.6.0.tgz", \
      "/opt/rapids/rapidsai-cudf-22.6.0.tgz", \
      "/opt/rapids/rapidsai-cuml-22.6.0.tgz", \
      "/opt/rapids/rapidsai-cugraph-22.6.0.tgz", \
      "/opt/rapids/viz/rapidsai/" \
    ]

# Everything will be out of /opt/rapids/viz
WORKDIR /opt/rapids/viz

# Clean and install the packages
RUN rm -rf node_modules && yarn bootstrap

# # Build the GUI
RUN yarn make

CMD ["yarn", "start"]
