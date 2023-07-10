<div align="center">
    <h1>GeneshiftBot</h1>
    <h3>I don't know why I made this.</h3>
</div>
<br />

<p align="center">
    <img src="https://img.shields.io/github/v/release/DamienVesper/GeneshiftBot?style=for-the-badge&color=f82055&include_prereleases">
    <img src="https://img.shields.io/github/last-commit/DamienVesper/GeneshiftBot?style=for-the-badge&color=f82055">
    <img src="https://img.shields.io/github/languages/code-size/DamienVesper/GeneshiftBot?style=for-the-badge&color=f82055">
</p>
<br />

## Installation
This project utilizes [pnpm](https://pnpm.io). No other package manager is supported for this project.

To install dependencies for this project, open a command line interface at the directory of the cloned repository, and run:
```sh
pnpm install
```

This will create a `node_modules` directory in that of your project and link the packages there.

## Setup
Testing the application using a database on your own machine will require a localhost database setup:

1. Create a `.env` in the root directory of the repository.
2. Inside of the `.env` file, include the following:
```
DISCORD_BOT_TOKEN="<token>"
MONGO_URI="<uri>"
```
Replace `<uri>` and `<discord bot token>` with your MongoDB URI and Discord bot token.

## Development
```
pnpm run dev
```

Note: You will need MongoDB and Node.js installed to be able to run the program.
