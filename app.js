const Manager = require("./lib/Manager");
const Engineer = require("./lib/Engineer");
const Intern = require("./lib/Intern");
const inquirer = require("inquirer");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.resolve(__dirname, "output");
const outputPath = path.join(OUTPUT_DIR, "team.html");

const render = require("./lib/htmlRenderer");


// Write code to use inquirer to gather information about the development team members,
// and to create objects for each team member (using the correct classes as blueprints!)

// After the user has input all employees desired, call the `render` function (required
// above) and pass in an array containing all employee objects; the `render` function will
// generate and return a block of HTML including templated divs for each employee!

// After you have your html, you're now ready to create an HTML file using the HTML
// returned from the `render` function. Now write it to a file named `team.html` in the
// `output` folder. You can use the variable `outputPath` above target this location.
// Hint: you may need to check if the `output` folder exists and create it if it
// does not.

// HINT: each employee type (manager, engineer, or intern) has slightly different
// information; write your code to ask different questions via inquirer depending on
// employee type.

// HINT: make sure to build out your classes first! Remember that your Manager, Engineer,
// and Intern classes should all extend from a class named Employee; see the directions
// for further information. Be sure to test out each class and verify it generates an
// object with the correct structure and methods. This structure will be crucial in order
// for the provided `render` function to work! ```

const employees = [];
let teamName = "My Team";

// Function that does actual prompting
async function doPrompt(promptType, promptMsg, promptChoices) {
  return inquirer.prompt([{
    type: promptType,
    name: "data",
    message: promptMsg,
    choices: promptChoices
  }]);
};

// Capture information about all employees on the team
async function getInput() {

  // Local function to get email address. Verify that it is valid, but only once, then allow
  async function validateEmail(promptMsg) {
    let email = await doPrompt("input", promptMsg);
    let pos = email.data.indexOf("@");
    if ((pos === -1) || (email.data.lastIndexOf(".") < pos)) {
      email = await doPrompt("input", "Invalid format. Please re-enter email address:");
    };
    return email;
  };

  let keepGoing = true;

  // Get manager name, and make sure it isn't blank
  let resName = await doPrompt("input", "What is your name?");
  if (resName.data.trim() === "") {
    let resName = await doPrompt("input", "Your name cannot be blank. Please enter your name:");
    if (resName.data.trim() === "") {
      return false; // If name still blank, then exit
    };
  };

  // Get team name and manager's ID, email, and office number. Only need to validate email address
  let resTeam = await doPrompt("input", "What is your team name?");
  let resId = await doPrompt("input", "What is your employee ID?");
  let resEmail = await validateEmail("What is your email address?");
  let resNum = await doPrompt("input", "What is your office number?");

  // Set global teamName to entered value
  teamName = resTeam.data;

  // Add manager to employees array. Assume that they are adding at least one employee
  employees.push(new Manager(resName.data, resId.data, resEmail.data, resNum.data));

  while (keepGoing) {
    console.log('\n');

    // Get next employee name, if blank, skip to prompt
    let resName = await doPrompt("input", "What is the employee's name?");
    if (resName.data.trim() != "") {
      let resId = await doPrompt("input", "What is the employee's ID?");
      let resEmail = await validateEmail("What is the employee's email address?");
      let resType = await doPrompt("list", `What type of employee is ${resName.data}?`, ["Engineer", "Intern"]);

      // If intern, prompt for school, otherwise prompt for GitHub name; then add to employees array
      if (resType.data === "Intern") {
        let resSchool = await doPrompt("input", "What is this intern's school name?");
        employees.push(new Intern(resName.data, resId.data, resEmail.data, resSchool.data));
      }
      else {
        let resGithub = await doPrompt("input", "What is this engineer's GitHub user name?");
        employees.push(new Engineer(resName.data, resId.data, resEmail.data, resGithub.data));
      }
    };

    console.log('\n');

    let resContinue = await doPrompt("confirm", "Add another employee?");

    keepGoing = resContinue.data;
  };
  return true
};

async function generatePage() {
  console.log("\n *** Welcome to the Team Page Generator *** \n");

  // Get user input, create list of employees
  if ((await getInput()) && (employees.length > 0)) {
      let teamPage = render(employees, teamName);
    
    // If output directory does not exist, create it
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    };

    // See if output file exists; if so, prompt for overwrite; if no, enter new filename
    let outputReady = false;

    while (!outputReady) {
      if (fs.existsSync(outputPath)) {
        let confirmOverwrite = await doPrompt("confirm", `${outputPath} already exists. Overwrite?`)
        if (confirmOverwrite.data) {
          outputReady = true;
        }
        else {
          let newFilename = await doPrompt("input", "Enter new html file name:");
          let parseName = path.parse(newFilename.data).name.trim();
          if ((newFilename) && (parseName != "")) { 
            outputPath = path.join(OUTPUT_DIR, `${parseName}.html`);
          }
          else {
            return // User didn't enter valid alternate name, just give up
          };
        };
      }
      else {
        outputReady = true;
      };
    };

    fs.writeFile(outputPath, teamPage, (err) => {
      if (err) throw err;
      console.log(`${outputPath} has been saved.`);
      console.log("\n *** Thank you for using the Team Page Generator! *** \n");
    });
  };
};

generatePage();