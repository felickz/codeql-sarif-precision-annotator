const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs').promises
const path = require('path')
const csv = require('csv-parse/sync')

async function run() {
  try {
    // Get input parameters
    const sarifInput = core.getInput('sarif_file', { required: true })
    const outputFile = core.getInput('output_file', { required: true })

    // Read the input SARIF file
    const sarifContent = await fs.readFile(sarifInput, 'utf8')
    const sarifData = JSON.parse(sarifContent)

    // Feature flag to load CSV from local folder
    const useLocalCsv = core.getInput('use_local_csv') !== 'false'

    let csvContent
    if (useLocalCsv) {
      // Load CSV from local folder
      let localCsvPath = path.join(
        __dirname,
        '../data/code-scanning-query-list/code-scanning-query-list.csv'
      )

      // Check if the file exists, if not, use the alternative path (published in dist/code-scanning-query-list.csv)
      try {
        await fs.access(localCsvPath)
      } catch (error) {
        localCsvPath = path.join(__dirname, './code-scanning-query-list.csv')
      }
      csvContent = await fs.readFile(localCsvPath, 'utf8')
    } else {
      // // Download and extract the CSV file
      // const csvUrl =
      //   'https://github.com/github/codeql/actions/runs/12241011772/artifacts/2295216815'
      // const response = await fetch(csvUrl)
      // const buffer = await response.buffer()
      // const zip = new AdmZip(buffer)
      // const csvEntry = zip
      //   .getEntries()
      //   .find(entry => entry.entryName.endsWith('.csv'))
      // csvContent = csvEntry.getData().toString('utf8')
    }

    // Parse the CSV content
    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    })

    // Create a map of query IDs to precisions
    const precisionMap = new Map(
      records.map(record => [record['Query ID'], record['Precision']])
    )

    // Process each rule in the SARIF file
    for (const sarifRun of sarifData.runs) {
      for (const extension of sarifRun.tool.extensions || []) {
        for (const rule of extension.rules || []) {
          const queryId = rule.properties?.id || rule.id
          const precision = precisionMap.get(queryId)

          if (precision) {
            // Add precision as a tag
            if (!rule.properties) rule.properties = {}
            if (!rule.properties.tags) rule.properties.tags = []

            // Check if a precision tag already exists and remove it
            rule.properties.tags = rule.properties.tags.filter(
              tag => !tag.includes(' precision')
            )

            // Add the new precision tag
            rule.properties.tags.push(`${precision} precision`)
          }
        }
      }
    }

    // Write the updated SARIF to the output file
    await fs.writeFile(outputFile, JSON.stringify(sarifData, null, 2), 'utf8')

    console.log(`Updated SARIF file written to ${outputFile}`)
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`)
  }
}

module.exports = { run }
