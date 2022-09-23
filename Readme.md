Continuously update collection of transcripts of public speeches given by [Narendra Modi](https://en.wikipedia.org/wiki/Narendra_Modi). 
Collected from official PM website - [https://narendramodi.in](https://www.narendramodi.in/category/text-speeches). Contains over 860 speeches and counting.
Data is updated once everyday using Github Action.

### How to use -

All data is available in - [data.csv](data.csv)

#### Data columns - 
 - href        : link to speech 
 - title       : title of speech
 - date        : date of speech
 - img         : image src for the main image on page
 - youtubeURL  : URL for video of the speech, if available
 - speechText.  : Full text of speech

### Data source - 
Website - https://www.narendramodi.in/category/text-speeches

#### Endpoint used - 

For english speeches - https://www.narendramodi.in/speech/loadspeeche?page=1&language=hi

For speeches in hindi - https://www.narendramodi.in/speech/loadspeeche?page=1&language=en 
