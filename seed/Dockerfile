FROM mongo:latest

ARG DATABASE_URI
ARG USERNAME
ARG PASSWORD

ENV DATABASE_URI ${DATABASE_URI}
ENV USERNAME ${USERNAME}
ENV PASSWORD ${PASSWORD}

COPY query.cats.json /query.cats.json
COPY query.owners.json /query.owners.json

CMD mongoimport --username ${USERNAME} --password ${PASSWORD} --uri ${DATABASE_URI} --collection cats --drop --jsonArray --file /query.cats.json && \
    mongoimport --username ${USERNAME} --password ${PASSWORD} --uri ${DATABASE_URI} --collection owners --drop --jsonArray --file /query.owners.json
