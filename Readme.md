Continuously update collection of transcripts of public speeches given by [Narendra Modi](https://en.wikipedia.org/wiki/Narendra_Modi). 
Collected from official PM website - [https://narendramodi.in](https://www.narendramodi.in/category/text-speeches). Contains over 860 speeches and counting.
Data is updated once everyday using Github Action.

### How to use -

All data is available in - [data.csv](data.csv)
Also available as [kaggle dataset](https://www.kaggle.com/datasets/ankitmishra0/narendra-modi-speeches?select=data.csv)

#### Data columns - 

| Column name | Description |
|--|--|
| href | full URL of speech (example [link](https://www.narendramodi.in/text-of-prime-minister-narendra-modi-addresses-council-of-mayors-and-deputy-mayors-of-bjp-in-gujarat-564556))  |
|title||
|date||
|img|image src for the main image on page|
|youtubeURL|Youtube URL of the speech, if available|
|speechText|full text of speech|

### Data source - 
Website - https://www.narendramodi.in/category/text-speeches

#### Endpoint used - 

For english speeches - https://www.narendramodi.in/speech/loadspeeche?page=1&language=hi

For speeches in hindi - https://www.narendramodi.in/speech/loadspeeche?page=1&language=en 
