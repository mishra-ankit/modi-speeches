import jsdom from "jsdom";
import fs from "fs";
import path from 'path';
import { CSVFile } from "./CSVFile.js";
const { JSDOM } = jsdom;

const dataFilePath = path.resolve('data.csv');

function speechExsist(url) {
    const content = fs.readFileSync(dataFilePath);
    return content.includes(url);
}

(async () => {
    const csvFile = new CSVFile({
        path: dataFilePath,
        headers: true
    });
    let count = 0;
    const start = 1;
    const end = 108;
    const lang = "hi";
    for (let page = start; page < end; page++) {
        const url = `https://www.narendramodi.in/speech/loadspeeche?page=${page}&language=${lang}`;
        try {
            console.log(url);
            const dom = (await JSDOM.fromURL(url));
            const document = dom.window.document;

            const speechesBox = Array.from(document.querySelectorAll(".speechesBox"));
            for (let index = 0; index < speechesBox.length; index++) {
                const speech = speechesBox[index];
                const { href, innerHTML: title } = speech.querySelector(".speechesItemLink.left_class a");
                const { innerHTML: date } = speech.querySelector(".pwdBy");
                const { src } = speech.querySelector("img");

                if (speechExsist(href)) {
                    console.log("Saved speech found -", href, " Exiting now.");
                    return;
                }

                const info = await getSpeechInfo(href);
                const speechData = {
                    href,
                    title: title.trim(),
                    date: date.trim(),
                    img: src,
                    ...info
                };
                count++;
                await csvFile.append([speechData]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    console.log(count, " speech added");
})()

async function getSpeechInfo(url) {
    console.log("Speech info: ", url);
    const dom = await JSDOM.fromURL(url);
    const document = dom.window.document;

    const articleBody = document.querySelector(".articleBody");
    const youtubeURL = articleBody.querySelector("iframe").src;
    const nodes = Array.from(articleBody.querySelectorAll("p"));
    const texts = [];
    nodes.forEach(p => {
        const text = p.textContent ? p.textContent.trim() : ""
        if (text.length)
            texts.push(text)
    })
    return {
        youtubeURL,
        speechText: texts.join(" "),
    }
}
