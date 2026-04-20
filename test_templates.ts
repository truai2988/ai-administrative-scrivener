import { getAssignmentTemplates } from './src/lib/constants/assignmentTemplates'; 
async function main() { 
  const tmp = await getAssignmentTemplates(); 
  console.log(JSON.stringify(tmp, null, 2)); 
} 
main();
