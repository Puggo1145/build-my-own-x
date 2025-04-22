#!/usr/bin/env node
import arg from "arg"
import chalk from "chalk"
import path from "path"
import fs from "fs"

try {
    const args = arg({
        "--start": Boolean,
        "--build": Boolean
    })
    if (Object.keys(args).length === 1) {
        throw new Error("No command found")
    }

    if (args["--start"]) {
        const config = readPackageJsonConfig()
        console.log(config);
        
        console.log(chalk.bgCyanBright("App started"));
    }

} catch (error: unknown) {
    console.error(chalk.yellow(
        error instanceof Error
            ? error.message
            : "invalid command"
    ));
    showUsage()
}

/**@description show usage when user input invalid command */
function showUsage() {
    console.log(`
[USAGE]: 
    --start: start the app
    --build: build the app
    `)
}

function readPackageJsonConfig() {
    try {
        const filePath = path.join(process.cwd(), "package.json");
        const packageJsonFile = fs.readFileSync(filePath)
        const packageJsonFileContent = JSON.parse(packageJsonFile.toString())
        return packageJsonFileContent["tool"]
    } catch (error: any) {
        console.error(chalk.redBright(`Error happened when starting the app: ${error.message}`));
    }
}
