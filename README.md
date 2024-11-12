# pronote-puppeteer-agora06

- [1. What this tool does ?](#1-what-this-tool-does-)
- [2. Architecture Client/Server](#2-architecture-clientserver)
  - [2.1. Server](#21-server)
  - [2.2. Client](#22-client)
- [3. Results directory](#3-results-directory)
  - [3.1. cahierDeTexte-courses.json](#31-cahierdetexte-coursesjson)
  - [3.2. cahierDeTexte-travailAFaire.json](#32-cahierdetexte-travailafairejson)
  - [3.3. studentInfo.json](#33-studentinfojson)
  - [3.4. id](#34-id)
  - [3.5. md5](#35-md5)
- [4. Files Processing](#4-files-processing)
  - [4.1. Reading Files](#41-reading-files)
  - [4.2. Parsing and Converting Data](#42-parsing-and-converting-data)
  - [4.3. Inserting Data into Database](#43-inserting-data-into-database)
  - [4.4. Generating Unique IDs](#44-generating-unique-ids)
  - [4.5. Computing Checksums](#45-computing-checksums)
  - [4.6. Tracking Processed Files](#46-tracking-processed-files)
- [5. data analytics choice](#5-data-analytics-choice)
  - [5.1. Measures](#51-measures)
    - [5.1.1. Homework Completion Rate](#511-homework-completion-rate)
    - [5.1.2. Homework Completion Timeliness](#512-homework-completion-timeliness)
    - [5.1.3. Average Homework Duration](#513-average-homework-duration)
    - [5.1.4. Homework Load Per Week](#514-homework-load-per-week)
    - [5.1.5. Homework Load Per Subject](#515-homework-load-per-subject)
    - [5.1.6. Homework Completion Per Subject](#516-homework-completion-per-subject)

## 1. What this tool does ?

little node js tool to get pronote data as json files

- grab data to results folder from pronote into 3 json files
- process these files and insert data in an sqlite database
- generate measures based on these data

## 2. Architecture Client/Server

### 2.1. Server

The server can be launched using the command:
`node src/index.js --server`

that will by default run the following tasks:

- Scheduled tasks:

  - retrievePronoteData: retrieves data from pronote and stores them
    in results directory
  - processPronoteData: process files in results directory
  - processDataMetrics: generates metrics.json
  - generateNotifications: generates notification to subscribed browser
    clients

- Server: Express server that serves different web services
  - served by default on <http://localhost:3001>

### 2.2. Client

The client side can be launched in 2 different ways:

- development: using HMR by launching `yarn run dev`
  - served by default on <http://localhost:3000>
  - will contact server url provided by `VITE_WEBSERVICE_URL` env
    variable (defaults to <http://localhost:3001>)
  - `VITE_WEBSERVICE_URL` env variable is injected in index.html using
    the file `web/.env.development`

- production:
  - generates the dist folder using `yarn run prod`
  - serve the dist folder using `yarn run serveProduction`
  - served by default on <http://localhost:3000>
  - the web service url is provided by the file `web/.env.production`

## 3. Results directory

The results folder contains JSON files generated by the Pronote data retrieval process. These files are organized by
timestamped directories, each representing a specific data retrieval session.

These files are generated by the PronoteCrawler class during the data retrieval process. The crawler navigates through
the Pronote interface, extracts the necessary information, and writes it into these JSON files. The files are then used
for further
data processing and analysis.

Here are the key files and their contents:

### 3.1. cahierDeTexte-courses.json

This file contains information about the resources related to the "Cahier de Texte" (Notebook) feature in Pronote. It
includes details about the educational content and resources provided to students.

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

### 3.2. cahierDeTexte-travailAFaire.json

This file contains information about the homework assignments ("Travail à Faire") listed in the "Cahier de Texte". It
includes details about the assignments, deadlines, and other relevant information.

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

### 3.3. studentInfo.json

This file contains general information about the student, such as their full name, grade, school, and session number.
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

### 3.4. id

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
    - but I probably can rely on the data set on all the first cahierDeTexte row referencing the
      course. So Id can be composed of:
      - subject
      - professor (what happen if the professor is replaced ? is it indicated in pronote ?)

  - the "CahierDeTexte" (I think it corresponds to the instance of the course at given
    date). So Id can be composed of:

    - courseId (see above)
    - Date
    - DateFin

could I use <https://github.com/bain3/pronotepy/blob/master/pronotepy/pronoteAPI.py> to decode ids ?

### 3.5. md5

checksum can be computed on the each object by first removing the fields:

- Id
- session

## 4. Files Processing

### 4.1. Reading Files

The system reads JSON files containing course data, such as cahierDeTexte-courses.json.

### 4.2. Parsing and Converting Data

The JSON data is parsed and converted into structured objects. For example, course items are converted into course
objects with properties like courseId, startDate, endDate, etc.

### 4.3. Inserting Data into Database

The converted objects are inserted into the database. Tables like courses, content, attachments, and teachers are used
to store the data.

### 4.4. Generating Unique IDs

Unique IDs for courses are generated using a combination of courseId, startDate, and endDate.

### 4.5. Computing Checksums

Checksums are computed for each object by removing specific fields like Id and session and then generating an MD5 hash.

### 4.6. Tracking Processed Files

A separate table, processed_files, is used to track the processing status of each file. Files are marked as processed
once they are successfully inserted into the database.

## 5. data analytics choice

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

### 5.1. Measures

Generate notifications when new homework.

#### 5.1.1. Homework Completion Rate

This metric helps you understand the overall completion rate of homework assignments.

#### 5.1.2. Homework Completion Timeliness

This metric shows how often homework is completed on or before the due date.

#### 5.1.3. Average Homework Duration

This metric provides insight into the average time required to complete homework assignments.

#### 5.1.4. Homework Load Per Week

This metric helps you track the number of homework assignments given each week, allowing you to identify weeks with a
high workload.

#### 5.1.5. Homework Load Per Subject

This metric shows the distribution of homework assignments across different subjects.

#### 5.1.6. Homework Completion Per Subject

This metric provides the completion rate of homework assignments for each subject, helping you identify subjects where
homework is consistently completed or not.
