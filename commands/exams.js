const index = require('../index.js');
const MAX_EMBED = 2000; // maximum characters allowed per embedded message
module.exports = {
  name: "exams",
  args: false,
  log: false,
  usage: "`!exams`",
  description:
    "Displays examination information for each of the user's course roles.",
  async execute(message) {
    // If the message is in a server
    if (message.guild) {
      // find the exam courses of the user by checking their roles
      var exams = new Array();
      message.member.roles.forEach(function(value) {
        var exam = index.parseExam(message, value.name);
        if (exam instanceof Array) {
          for (let i = 0; i < exam.length; i++) {
            if (exam[i] != undefined) exams.push(exam[i]);
          }
        }
        else if (exam != undefined) exams.push(exam);
      });
      exams.sort(function(a, b) { // sort by alphabetical exam course
        if(a < b) { return -1; }
        if(a > b) { return 1; }
        return 0;
      })
      const examData = index.formatExams(message, exams, false); // get the formatted data
      if (examData.length > MAX_EMBED && message.member.hasPermission("ADMINISTRATOR"))
        message.reply(
          "too many arguments to process. It looks like you are an admin with course aliases. Try adding individual course roles instead."
        );
      else if (examData.length > MAX_EMBED)
        message.reply(
          "too many arguments to process. Try reducing the amount of course roles you have."
        );
      else if (examData.length > 0) {
        // generate the embedded message
        const embeddedMessage = index.examDataEmbed(examData);
        message.reply(embeddedMessage);
      }
      else
        message.reply(
          "couldn't find exam data for your course roles for the current trimister."
        ); // none of the user courses were valid
    }
    // The message was sent in a DM, can't retrieve the server info
    else
      return message.reply(
        "Looks like you didn't send this message from a server"
      );
  }
};
