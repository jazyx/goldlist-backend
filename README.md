# GOLDLIST METHOD BACKEND #

Express server to host a React frontend [Repo](git@github.com:jazyx/goldlist-frontend.git) for recording and reviewing new words and expressions in a foreign language.

[Overview of the paper-and-pen Goldlist method](https://www.open.edu/openlearn/languages/learning-languages/the-goldlist-method)

The app allows you to enter new expressions that you have met in the language you are learning, together with a hint about their meaning. These expressions will be shown to you a few days later, and you will be encouraged to type out those that you are not yet ready to remember, and to select at least 30% of the words to retain in your long-term memory.

## Features ##

1. All features are available as a Guest user
2. You can register a username to use the app on different devices or allow different users to connect from the same device
3. Twelve pre-defined lists of simple English vocabulary are provided to help understand how the method words
4. When you have chosen to retain all but the last 33% of the expressions in a list, the remaining unretained words will be scheduled for recombination into a new list.
5. You can choose:
   1. One of three languages for the UI: English, French or Russian
   2. How many words to add to complete each list
   3. How many days will pass before you are asked to review a list
   (The last two preferences are saved across devices.)
6. You can show or hide the hints and typing preview for all expressions, or on an expression-by-expression basis
7. If you choose to hide hints and typing preview, you can press Backspace while typing a review expression to show the full expression and its hint momentarily
8. Optional characters used to indicate word stress are ignored when retyping expressions
9. You can press Shift+Enter to create multiline hints