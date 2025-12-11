import { JSONPath } from 'jsonpath-plus';

export function evaluateJsonPath(json: unknown, path: string): unknown {
  try {
    const result = JSONPath({ path, json: json as object, wrap: false });
    return result;
  } catch (error) {
    console.error('JSONPath evaluation error:', error);
    return undefined;
  }
}

export function validateExpression(
  expression: string,
  responseData: unknown,
  statusCode: number
): { passed: boolean; error?: string } {
  if (!expression || expression.trim() === '') {
    return { passed: true };
  }

  try {
    let processedExpression = expression;
    
    const jsonPathRegex = /\$\.[\w.\[\]]+/g;
    const matches = expression.match(jsonPathRegex) || [];
    
    for (const match of matches) {
      const result = evaluateJsonPath(responseData, match);
      const replacement = JSON.stringify(result);
      processedExpression = processedExpression.replace(match, replacement);
    }

    processedExpression = processedExpression.replace(/\bstatus\b/g, String(statusCode));

    const evalFunc = new Function('context', `
      with (context) {
        return ${processedExpression};
      }
    `);

    const result = evalFunc({ status: statusCode, body: responseData, $: responseData });
    
    return { passed: Boolean(result) };
  } catch (error) {
    return { 
      passed: false, 
      error: error instanceof Error ? error.message : 'Invalid expression' 
    };
  }
}

export function extractVariables(
  responseData: unknown,
  variablesToExtract: Array<{ name: string; path: string }>
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};

  for (const { name, path } of variablesToExtract) {
    try {
      variables[name] = evaluateJsonPath(responseData, path);
    } catch (error) {
      console.error(`Error extracting variable ${name}:`, error);
      variables[name] = undefined;
    }
  }

  return variables;
}

export function replaceVariables(
  text: string,
  variables: Record<string, unknown>
): string {
  let result = text;
  
  const variableRegex = /\{\{(\w+)\}\}/g;
  
  result = result.replace(variableRegex, (match, varName) => {
    const value = variables[varName];
    if (value === undefined) return match;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });

  return result;
}