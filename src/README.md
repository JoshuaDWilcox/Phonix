# How to set up (1 time only)

first run `npm i`

# How to run and develop at the same time

then run `npm run dev`  
this gives you a live application view, and will update as you code (which is sweet)  

If you run it rn, you will see the default react project. I have made no changes to this yet.  
After finalising on a design in Figma, we can start coding the front-end.  

# Understanding the code

The main 'html' code is in `src/ui/App.tsx`  
All of our code should be in `/src`

### For front-end
Code will be present in `/src/ui`

### For back-end
Code in a new folder in `/src`


# If you run into command not found errors
first: `npm install --save-dev electron`  
also: `npm install electron-builder --save-dev` (this is a big one)  
also: `npm install --save-dev cross-env` (for linux and mac devs)  
also: `npm i --save-dev npm-run-all`

# Python Dependencies

Install Python dependencies for speech-to-text functionality:

```bash
pip install -r src/python/requirements.txt
```

# References

- RealtimeSTT_faster. (2024). mdv314/RealtimeSTT_faster. GitHub. https://github.com/mdv314/RealtimeSTT_faster
- RealtimeSTT. (2024). KoljaB/RealtimeSTT. GitHub. https://github.com/KoljaB/RealtimeSTT
- Radford, A., et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision. OpenAI Whisper. https://github.com/openai/whisper
- Electron. (2024). Electron - Build cross-platform desktop apps with JavaScript, HTML, and CSS. https://www.electronjs.org/
