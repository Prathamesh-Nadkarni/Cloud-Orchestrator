import * as Blockly from 'blockly';

export const defineTerraformBlocks = () => {
  Blockly.common.defineBlocksWithJsonArray([
    // 1. Resource Block (The main building block)
    {
      "type": "terraform_resource",
      "message0": "resource %1 %2 %3 %4",
      "args0": [
        { "type": "field_input", "name": "TYPE", "text": "aws_instance" },
        { "type": "field_input", "name": "NAME", "text": "main" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 230,
      "tooltip": "Defines a cloud resource (AWS, Azure, GCP)"
    },
    // 2. Data Source Block (Reading existing infra)
    {
      "type": "terraform_data",
      "message0": "data %1 %2 %3 %4",
      "args0": [
        { "type": "field_input", "name": "TYPE", "text": "aws_ami" },
        { "type": "field_input", "name": "NAME", "text": "ubuntu" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 290,
      "tooltip": "Read from an existing Data Source"
    },
    // 3. Output Block (Exposing values)
    {
      "type": "terraform_output",
      "message0": "output %1 %2 %3",
      "args0": [
        { "type": "field_input", "name": "NAME", "text": "public_ip" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 20,
      "tooltip": "Exports a value"
    },
    // 4. Nested Block (Crucial for ingress, lifecycle, tags, etc.)
    {
      "type": "terraform_nested_block",
      "message0": "%1 { %2 %3 }",
      "args0": [
        { "type": "field_input", "name": "NAME", "text": "ingress" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 180,
      "tooltip": "A sub-block like 'ingress' or 'tags'"
    },
    // 5. Provider Block
    {
      "type": "terraform_provider",
      "message0": "provider %1 %2 %3",
      "args0": [
        { "type": "field_input", "name": "NAME", "text": "aws" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 60
    },
    // 6. Variable Block
    {
      "type": "terraform_variable",
      "message0": "variable %1 %2 %3",
      "args0": [
        { "type": "field_input", "name": "NAME", "text": "region" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 330
    },
    // 7. Attribute Block (Key = Value)
    {
      "type": "terraform_attribute",
      "message0": "%1 = %2",
      "args0": [
        { "type": "field_input", "name": "KEY", "text": "ami" },
        { "type": "field_input", "name": "VALUE", "text": "var.ami_id" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 120
    },
    // 8. Locals Block
    {
      "type": "terraform_locals",
      "message0": "locals %1 %2",
      "args0": [
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 200,
      "tooltip": "Define local values for reuse (add attribute blocks inside)"
    },
    // 9. Module Block
    {
      "type": "terraform_module",
      "message0": "module %1 %2 %3",
      "args0": [
        { "type": "field_input", "name": "NAME", "text": "vpc" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "ATTRIBUTES" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 160,
      "tooltip": "Call a child module"
    }
  ]);
};