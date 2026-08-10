# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

This project defines separate dev and stg environment stacks. By default the app includes both stacks in the synthesis output. Use the `--context env=` option to select a specific environment.

## Useful commands

* `npm run build`   type-check the project
* `npm run watch`   watch for changes and type-check
* `npm run test`    perform the jest unit tests
* `npm run ls`      list available stacks
* `npm run diff -- --context env=dev`    compare the dev stack with deployed state
* `npm run diff -- --context env=stg`    compare the stg stack with deployed state
* `npm run deploy -- --context env=dev`  deploy the dev stack
* `npm run deploy -- --context env=stg`  deploy the stg stack
* `npm run deploy:dev`  deploy the dev stack
* `npm run deploy:stg`  deploy the stg stack
* `npm run synth -- --context env=dev`   emit the synthesized dev CloudFormation template
* `npm run synth -- --context env=stg`   emit the synthesized stg CloudFormation template
