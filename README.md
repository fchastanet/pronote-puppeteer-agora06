# pronote-puppeteer-agora06

![Pronote project dashboard screenshot](doc/pronote-dashboard.png)

- [1. What this tool does ?](#1-what-this-tool-does-)
- [2. Architecture](#2-architecture)
  - [2.1. Software architecture](#21-software-architecture)
  - [2.2. Database](#22-database)
  - [2.3. Data Processor](#23-data-processor)
  - [2.4. Backend Server](#24-backend-server)
  - [2.5. Client](#25-client)
- [3. Serve the project](#3-serve-the-project)
  - [3.1. development mode](#31-development-mode)
  - [3.2. production mode](#32-production-mode)
  - [3.3. Alternative to pinggy](#33-alternative-to-pinggy)
  - [3.4. NodeJs hosting](#34-nodejs-hosting)
- [4. Results directory](#4-results-directory)
  - [4.1. cahierDeTexte-courses.json](#41-cahierdetexte-coursesjson)
  - [4.2. cahierDeTexte-travailAFaire.json](#42-cahierdetexte-travailafairejson)
  - [4.3. studentInfo.json](#43-studentinfojson)
  - [4.4. id](#44-id)
  - [4.5. md5](#45-md5)
- [5. Files Processing](#5-files-processing)
  - [5.1. Reading Files](#51-reading-files)
  - [5.2. Parsing and Converting Data](#52-parsing-and-converting-data)
  - [5.3. Inserting Data into Database](#53-inserting-data-into-database)
  - [5.4. Generating Unique IDs](#54-generating-unique-ids)
  - [5.5. Computing Checksums](#55-computing-checksums)
  - [5.6. Tracking Processed Files](#56-tracking-processed-files)
- [6. data analytics choice](#6-data-analytics-choice)
  - [6.1. Measures](#61-measures)
    - [6.1.1. Homework Completion Rate](#611-homework-completion-rate)
    - [6.1.2. Homework Completion Timeliness](#612-homework-completion-timeliness)
    - [6.1.3. Average Homework Duration](#613-average-homework-duration)
    - [6.1.4. Homework Load Per Week](#614-homework-load-per-week)
    - [6.1.5. Homework Load Per Subject](#615-homework-load-per-subject)
    - [6.1.6. Homework Completion Per Subject](#616-homework-completion-per-subject)

## 1. What this tool does ?

little node js tool to get pronote data as json files

- grab data to results folder from pronote into 3 json files
- process these files and insert data in an sqlite database
- generate measures based on these data
- provide a web interface to see measures and subscribe to notifications

## 2. Architecture


### 2.1. Software architecture

The architecture is decomposed in 4 parts:

- Data processor responsible to gather pronote data,
  to feed database and to send notifications.
- Backend server, different web services like providing
  metrics to the frontend and managing notification
  subscriptions.
- Frontend server that serves the UI as an HTML file
- The UI that is an HTML file using vanilla javascript
  compiled using [vitejs](https://vitejs.fr/).

![Pronote project architecture diagram](doc/sequenceDiagram.png)
[Pronote project architecture plantuml diagram](doc/sequenceDiagram.puml)

### 2.2. Database

![db diagram](doc/database-diagram.png)
[db diagram](https://dbdiagram.io/d/pronote-67499b7fe9daa85aca20e147)
[db edit link (only me)](https://dbdiagram.io/d/pronote-67499b7fe9daa85aca20e147)

### 2.3. Data Processor

This process can be launched using the command:
`node src/dataProcessor.js`

This process does the following tasks:

- retrievePronoteData: retrieves data from pronote and stores
  them in results directory
- processPronoteData: process files in results directory
- processDataMetrics: generates metrics.json
- generateNotifications: generates notification to subscribed
  browser clients

### 2.4. Backend Server

The server can be launched using the command:
`yarn run backendServer`

It internally runs an Express server that serves different web
services.
It is served by default on <http://localhost:3001>.

### 2.5. Client

The client side can be launched in 2 different ways:

- development: using HMR by launching `yarn run frontendServer-dev`

  - served by default on <http://localhost:3000>
  - will contact server url provided by `VITE_WEBSERVICE_URL` env
    variable (defaults to <http://localhost:3001>)
  - `VITE_WEBSERVICE_URL` env variable is injected in index.html
    using the file `web/.env.development`
  - if OOM error appears try to use `export NODE_OPTIONS=--max-old-space-size=8192`

- production:

  - generates the dist folder using `yarn run prod`
  - serve the dist folder using `yarn run serveProduction`
  - served by default on <http://localhost:3000>
  - the web service url is provided by the file `web/.env.production`

## 3. Serve the project

### 3.1. development mode

Launch data process (retrieve pronote data + process data):
`yarn run dataProcessor`

Launch web server:
`yarn run frontendServer-dev`

Launch backend server (api):
`yarn run backendServer`

### 3.2. production mode

backend server will serve both api and frontend static files.

Launch data process (retrieve pronote data + process data):
`yarn run dataProcessor`

Create `.env.prod` based on `.env.template`
Example:

```text
RESULTS_DIR=results
PUBLIC_DIR=dist

SQLITE_DATABASE_FILE=db/pronote.sqlite

SESSION_DATABASE_FILE=db/sessions.sqlite
SESSION_EXPIRATION_IN_MS=900000
SESSION_SECRET=pleaseChangeMe
SESSION_COOKIE_SECURE=0

NOTIFICATIONS_RATE_LIMIT=5

SERVER_PORT=3001
WEBSERVICE_URL=http://localhost:3001
ASSETS_PORT=3001
ASSETS_URL=http://localhost:3001
```

Launch web server (+api):
`ENV_FILE=.env.prod yarn run backendServer`

Launch ssh tunnel to get a https url in order to be able to subscribe to notification service:
<https://pinggy.io/blog/best_ngrok_alternatives/>

```bash
ssh -p 443 \
  -L4300:localhost:3001 \
  -o StrictHostKeyChecking=no \
  -o ServerAliveInterval=30 \
  -t -R0:localhost:3001 eu.a.pinggy.io x:https
```

### 3.3. Alternative to pinggy

[Cloudflare](https://www.cloudflare.com/en-gb/plans/developer-platform/)
[awesome-tunneling](https://github.com/anderspitman/awesome-tunneling)

### 3.4. NodeJs hosting

[Vercel](https://vercel.com/) free but limited in number of cron

## 4. Results directory

The results folder contains JSON files generated by the Pronote data retrieval process.
These files are organized by timestamped directories, each representing a specific data
retrieval session.

These files are generated by the PronoteCrawler class during the data retrieval process.
The crawler navigates through the Pronote interface, extracts the necessary information,
and writes it into these JSON files. The files are then used for further data processing
and analysis.

Here are the key files and their contents:

### 4.1. cahierDeTexte-courses.json

This file contains information about the resources related to the "Cahier de Texte"
(Notebook) feature in Pronote. It includes details about the educational content and
resources provided to students.

The structure typically includes:

```json
{
  "resources": [
    {
      "id": "resource_id",
      "title": "Resource Title",
      "description": "Resource Description",
      "type": "Resource Type",
      "url": "Resource URL"
    },
    ...
  ]
}
```

### 4.2. cahierDeTexte-travailAFaire.json

This file contains information about the homework assignments ("Travail à Faire")
listed in the "Cahier de Texte". It includes details about the assignments, deadlines,
and other relevant information.

The structure typically includes:

```json
{
  "homework": [
    {
      "id": "homework_id",
      "title": "Homework Title",
      "description": "Homework Description",
      "dueDate": "YYYY-MM-DD",
      "subject": "Subject Name"
    },
    ...
  ]
}
```

### 4.3. studentInfo.json

This file contains general information about the student, such as their full name,
grade, school, and session number.
This information is extracted from the Pronote dashboard.

The structure typically includes:

```json
{
  "fullName": "Student Full Name",
  "name": "Student Name",
  "grade": "Student Grade",
  "school": "School Name",
  "sessionNumber": "Session Number"
}
```

### 4.4. id

The ids are using the form `18#v9hvwyhDOSmz5nbOx-Gs_-w5dw13lavpZZ_N6Oq1dI4`
These ids are probably encoded using sha with private key based on the session id.

So using the same session I can find references to data (for example I can find
homework linked to course). But when the session change, the id is changing.

So I need to generate an id from data that are not supposed to change.

For HomeworkId I could use the fields:

- submittedDate

- subject

- And also the homework references in cahierDeTexte-courses.json:

  - the course (I think it corresponds to the course defined in the class planning)

    - the planned course for the entire year.
    - So several "CahierDeTexte" can reference the same Course.
    - but I probably can rely on the data set on all the first cahierDeTexte row
      referencing the course. So Id can be composed of:
      - subject
      - professor (what happen if the professor is replaced ? is it indicated in
        pronote ?)

  - the "CahierDeTexte" (I think it corresponds to the instance of the course at given
    date). So Id can be composed of:

    - courseId (see above)
    - Date
    - DateFin

could I use <https://github.com/bain3/pronotepy/blob/master/pronotepy/pronoteAPI.py> to
decode ids ?

### 4.5. md5

checksum can be computed on the each object by first removing the fields:

- Id
- session

## 5. Files Processing

### 5.1. Reading Files

The system reads JSON files containing course data, such as cahierDeTexte-courses.json.

### 5.2. Parsing and Converting Data

The JSON data is parsed and converted into structured objects. For example, course items
are converted into course
objects with properties like courseId, startDate, endDate, etc.

### 5.3. Inserting Data into Database

The converted objects are inserted into the database. Tables like courses, content,
attachments, and teachers are used
to store the data.

### 5.4. Generating Unique IDs

Unique IDs for courses are generated using a combination of courseId, startDate, and
endDate.

### 5.5. Computing Checksums

Checksums are computed for each object by removing specific fields like Id and session
and then generating an MD5 hash.

### 5.6. Tracking Processed Files

A separate table, processed_files, is used to track the processing status of each file.
Files are marked as processed once they are successfully inserted into the database.

## 6. data analytics choice

For data analytics, two main approaches are considered:

- data analytics tool similar to powerBI, 2 main choices are available

  - <https://redash.io/product/>
  - <https://superset.apache.org>

- generate HTML page with statistics generated statically, 2 main choices are available

  - <https://c3js.org/> based on d3.js without the need to know d3.js
  - <https://www.chartjs.org/docs/latest/> offers visually better charts than c3js

Data analytics tool similar to powerBI requires a higher learning curve and needs a
server side application.
Let's start simple with static site generation for the moment.

### 6.1. Measures

Generate notifications when new homework.

#### 6.1.1. Homework Completion Rate

This metric helps you understand the overall completion rate of homework assignments.

#### 6.1.2. Homework Completion Timeliness

This metric shows how often homework is completed on or before the due date.

#### 6.1.3. Average Homework Duration

This metric provides insight into the average time required to complete homework
assignments.

#### 6.1.4. Homework Load Per Week

This metric helps you track the number of homework assignments given each week,
allowing you to identify weeks with a high workload.

#### 6.1.5. Homework Load Per Subject

This metric shows the distribution of homework assignments across different subjects.

#### 6.1.6. Homework Completion Per Subject

This metric provides the completion rate of homework assignments for each subject,
helping you identify subjects where homework is consistently completed or not.
