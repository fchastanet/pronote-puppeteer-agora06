# Structure of cahierDeTexte-courses.json

- [1. Top-Level Fields](#1-top-level-fields)
  - [1.1. `verrouille`](#11-verrouille)
  - [1.2. `listeGroupes`](#12-listegroupes)
  - [1.3. `Matiere`](#13-matiere)
  - [1.4. `CouleurFond`](#14-couleurfond)
  - [1.5. `listeProfesseurs`](#15-listeprofesseurs)
  - [1.6. `Date`](#16-date)
  - [1.7. `DateFin`](#17-datefin)
  - [1.8. `dateTAF`](#18-datetaf)
  - [1.9. `listeContenus`](#19-listecontenus)
  - [1.10. `ListeRessourcesNumeriques`](#110-listeressourcesnumeriques)
  - [1.11. `nom`](#111-nom)
  - [1.12. `listeMatieres`](#112-listematieres)
- [2. Mapping to Course object](#2-mapping-to-course-object)
  - [2.1. Target: course Object](#21-target-course-object)
  - [2.2. Mapping Details](#22-mapping-details)
  - [2.3. Example Mapping](#23-example-mapping)
    - [2.3.1. Source JSON (cahierDeTexte-courses.json)](#231-source-json-cahierdetexte-coursesjson)
    - [2.3.2. Target Object (course)](#232-target-object-course)
    - [2.3.3. Additional Notes](#233-additional-notes)

File contains detailed information about the educational content and resources related to the "Cahier de Texte"
(Notebook) feature in Pronote. Here is a detailed explanation of each field in the JSON structure:

## 1. Top-Level Fields

### 1.1. [`verrouille`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3918%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A435%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A435%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Boolean
- **Description**: Indicates whether the resource is locked.

### 1.2. [`listeGroupes`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3919%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A436%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A436%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: Array
    - **Description**: List of groups associated with the resource.

### 1.3. [`Matiere`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-3190979%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8374%2C%22character%22%3A16%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2176%2C%22character%22%3A25%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3923%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A440%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A440%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6635%2C%22character%22%3A16%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: Object
    - **L**: String
      - **Description**: Name of the subject.
    - **N**: String
      - **Description**: Unique identifier for the subject.

### 1.4. [`CouleurFond`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2132%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3930%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A447%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A447%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: String
- **Description**: Background color in hexadecimal format.

### 1.5. [`listeProfesseurs`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2133%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3931%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A448%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A448%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: Array
    - **Description**: List of professors associated with the resource.
    - **L**: String
      - **Description**: Name of the professor.
    - **N**: String
      - **Description**: Unique identifier for the professor.

### 1.6. [`Date`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2142%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3940%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A457%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A457%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: String
    - **Description**: Start date and time of the resource in `DD/MM/YYYY HH:MM:SS` format.

### 1.7. [`DateFin`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2146%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3944%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A461%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A461%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: String
    - **Description**: End date and time of the resource in `DD/MM/YYYY HH:MM:SS` format.

### 1.8. [`dateTAF`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2150%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3948%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A465%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A465%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: String
    - **Description**: Date for the task in `DD/MM/YYYY` format.

### 1.9. [`listeContenus`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A2154%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A3952%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A469%2C%22character%22%3A13%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A469%2C%22character%22%3A13%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: Array
    - **Description**: List of content items.
    - **N**: String
      - **Description**: Unique identifier for the content.
    - **descriptif**: Object
      - **\_T**: Number
        - **Description**: Type identifier.
      - **V**: String
        - **Description**: HTML formatted description of the content.
    - **categorie**: Object
      - **\_T**: Number
        - **Description**: Type identifier.
      - **V**: Object
        - **N**: String
          - **Description**: Category identifier.
        - **G**: Number
          - **Description**: Category group identifier.
    - **ListeThemes**: Object
      - **\_T**: Number
        - **Description**: Type identifier.
      - **V**: Array
        - **Description**: List of themes associated with the content.
    - **libelleCBTheme**: String
      - **Description**: Label for the theme checkbox.
    - **parcoursEducatif**: Number
      - **Description**: Educational path identifier.

### 1.10. [`ListeRessourcesNumeriques`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-2341383%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8423%2C%22character%22%3A7%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-3190979%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8423%2C%22character%22%3A7%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8423%2C%22character%22%3A7%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6530%2C%22character%22%3A7%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-24_10-5340499%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6530%2C%22character%22%3A7%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6684%2C%22character%22%3A7%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: Object
    - **listeRessources**: Object
      - **\_T**: Number
        - **Description**: Type identifier.
      - **V**: Array
        - **Description**: List of digital resources.

### 1.11. [`nom`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-3190979%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8433%2C%22character%22%3A5%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-2341383%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8433%2C%22character%22%3A5%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-5207393%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8433%2C%22character%22%3A5%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-23_10-6977381%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6540%2C%22character%22%3A5%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-24_10-5340499%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6540%2C%22character%22%3A5%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6694%2C%22character%22%3A5%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: String
- **Description**: Name of the resource page.

### 1.12. [`listeMatieres`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-22_23-3190979%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A8374%2C%22character%22%3A11%7D%7D%2C%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Fwsl%2Ffchastanet%2Fpronote%2Fresults%2F2024-10-25_10-7110074%2FcahierDeTexte-courses.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A6635%2C%22character%22%3A11%7D%7D%5D%2C%22328a7521-ca5d-47b8-8e12-c82d3de33831%22%5D "Go to definition")

- **Type**: Object
  - **\_T**: Number
    - **Description**: Type identifier.
  - **V**: Array
    - **Description**: List of subjects.
    - **L**: String
      - **Description**: Name of the subject.
    - **N**: String
      - **Description**: Unique identifier for the subject.
    - **G**: Number
      - **Description**: Group identifier for the subject.
    - **couleur**: String
      - **Description**: Color associated with the subject in hexadecimal format.

## 2. Mapping to Course object

The `cahierDeTexte-courses.json` file contains course data in a structured JSON format. Each course item in this file
has various properties that need to be mapped to the corresponding properties in the `course` object.

### 2.1. Target: course Object

The course object is a structured representation of a course with specific properties. Below is the detailed mapping
between the properties in the `cahierDeTexte-courses.json` file and the `course` object.

### 2.2. Mapping Details

| Source Property (cahierDeTexte-courses.json) | Target Property (course object) | Description                                                                                                      |
| -------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| N                                            | courseItemId                    | Unique identifier for the course item.                                                                           |
| cours.V.N                                    | courseId                        | Unique identifier for the course.                                                                                |
| verrouille                                   | locked                          | Indicates if the course is locked.                                                                               |
| Matiere.V.N                                  | subject                         | Subject of the course, mapped using the subjects object.                                                         |
| CouleurFond                                  | backgroundColor                 | Background color associated with the course.                                                                     |
| listeProfesseurs.V                           | teacherList                     | List of teachers for the course. Each teacher's name is extracted from the L property.                           |
| Date.V                                       | startDate                       | Start date and time of the course.                                                                               |
| DateFin.V                                    | endDate                         | End date and time of the course.                                                                                 |
| dateTAF?.V                                   | homeworkDate                    | Date for the homework, if available.                                                                             |
| listeContenus.V                              | contentList                     | List of content items for the course. Each content item is mapped using the fromPronoteCourseItemContent method. |
| verrouille                                   | locked                          | Indicates if the course is locked (duplicate property).                                                          |
| CouleurFond                                  | backgroundColor                 | Background color associated with the course (duplicate property).                                                |

### 2.3. Example Mapping

#### 2.3.1. Source JSON (cahierDeTexte-courses.json)

```json
{
  "N": "18#v9hvwyhDOSmz5nbOx-Gs_-w5dw13lavpZZ_N6Oq1dI4",
  "cours": {
    "V": {
      "N": "31#qPeHLkKvtl1FR_nmT_hwOrcSClxnPTGrnTTGsACcdhA"
    }
  },
  "verrouille": false,
  "Matiere": {
    "V": {
      "N": "ESPAGNOL LV2"
    }
  },
  "CouleurFond": "#00FF00",
  "listeProfesseurs": {
    "V": [
      {
        "L": "Mme PRUNA E."
      }
    ]
  },
  "Date": {
    "V": "19/09/2024 08:55:00"
  },
  "DateFin": {
    "V": "19/09/2024 10:05:00"
  },
  "dateTAF": {
    "V": "20/09/2024"
  },
  "listeContenus": {
    "V": [
      {
        "N": "29#J73-o1QoRPYgtS_sCdrpqDCTsLov2TxDNmtkuUrcIRs",
        "descriptif": "<div>Content description</div>",
        "Date": {
          "V": "19/09/2024 08:55:00"
        },
        "DateFin": {
          "V": "19/09/2024 10:05:00"
        },
        "ListePieceJointe": {
          "V": [
            {
              "N": "39#AdCjbAUbkp6Q62plaGIMqYDYqifZ0PnyBXTVii0kozY",
              "L": "Exo la hora .pdf",
              "type": 1,
              "interne": false
            }
          ]
        }
      }
    ]
  }
}
```

#### 2.3.2. Target Object (course)

```javascript
{
  courseItemId: "18#v9hvwyhDOSmz5nbOx-Gs_-w5dw13lavpZZ_N6Oq1dI4",
  courseId: "31#qPeHLkKvtl1FR_nmT_hwOrcSClxnPTGrnTTGsACcdhA",
  locked: false,
  subject: "ESPAGNOL LV2",
  backgroundColor: "#00FF00",
  teacherList: ["Mme PRUNA E."],
  startDate: "19/09/2024 08:55:00",
  endDate: "19/09/2024 10:05:00",
  homeworkDate: "20/09/2024",
  contentList: [
    {
      id: "29#J73-o1QoRPYgtS_sCdrpqDCTsLov2TxDNmtkuUrcIRs",
      description: "<div>Content description</div>",
      date: "19/09/2024 08:55:00",
      endDate: "19/09/2024 10:05:00",
      attachmentList: [
        {
          id: "39#AdCjbAUbkp6Q62plaGIMqYDYqifZ0PnyBXTVii0kozY",
          name: "Exo la hora .pdf",
          type: 1,
          isInternal: false
        }
      ]
    }
  ],
  id: "ESPAGNOL LV2-19/09/2024 08:55:00-19/09/2024 10:05:00-Mme PRUNA E."
}
```

#### 2.3.3. Additional Notes

**Duplicate Properties:** The locked and backgroundColor properties appear twice in the
source JSON and are mapped without duplication.

**Optional Properties:** The homeworkDate property is optional and should be handled
accordingly.
