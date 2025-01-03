# CodeQL SARIF Precision Annotator

Annotates CodeQL SARIF files with precision information from
[GitHub Code Scanning query list artifact](https://github.com/github/codeql/actions/workflows/query-list.yml?query=branch%3Acodeql-cli%2Flatest)

![image](https://github.com/user-attachments/assets/af5a582f-9103-4274-8354-c92d642b686c)

## Usage

Configure CodeQL Action to not automatically upload, process the default SARIF, then explicitly upload the new enhanced SARIF.

```yaml
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          upload: false
          output: sarif-results
      
      - name: Annotate CodeQL SARIF with Precision tag
        uses: felickz/codeql-sarif-precision-annotator@main
        with:
          sarif_file: sarif-results/${{matrix.language}}.sarif
          output_file: sarif-results/${{matrix.language}}-precision.sarif
      
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: sarif-results/${{matrix.language}}-precision.sarif
```


## Local Dev

Test via `npx local-action . src/main.js .env.example`

