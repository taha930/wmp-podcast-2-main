FROM httpd:2.4
COPY ./assets/ /usr/local/apache2/htdocs/assets/
COPY ./components/ /usr/local/apache2/htdocs/components/
COPY ./scripts/ /usr/local/apache2/htdocs/scripts/
COPY ./styles/ /usr/local/apache2/htdocs/styles/
COPY ./index.html  /usr/local/apache2/htdocs/index.html
COPY ./.htaccess  /usr/local/apache2/htdocs/
RUN chmod -R 755 /usr/local/apache2/htdocs/

# Apache Konfiguration mit der eigenen config-Datei überschreiben
COPY ./custom-httpd.conf /usr/local/apache2/conf/httpd.conf
