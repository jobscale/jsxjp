FROM nginx
SHELL ["bash", "-c"]
WORKDIR /usr/share/nginx
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y openssl
COPY . .
RUN rm -fr html /etc/nginx/nginx.conf /etc/nginx/conf.d \
 && ln -sfn public html \
 && ln -sfn $(pwd)/nginx.conf /etc/nginx/nginx.conf \
 && ln -sfn $(pwd)/conf.d /etc/nginx/conf.d \
 && . ssl-keygen && openssl dhparam 256 > tls/dhparam.pem \
 && chown -R nginx. .
RUN rm -fr /var/lib/apt/lists/*
EXPOSE 443 80
