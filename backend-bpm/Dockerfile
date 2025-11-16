FROM python:3.12

RUN apt-get -q -y update 
RUN apt-get install -y gcc

WORKDIR /api

COPY requirements.txt .
COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

ENV FLASK_APP=flaskr

EXPOSE 4000

CMD [ "flask", "run", "--host=0.0.0.0", "--port=4000" ]