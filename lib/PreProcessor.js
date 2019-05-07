const ConsoleWriter = require("./ConsoleWriter");
const fs = require("fs");

class PreProcessor {
    static build(visualPackage, files) {
        let buildConfig;
        try {
            buildConfig = JSON.parse(fs.readFileSync(visualPackage.buildPath("buildConfig.json")).toString());
        } catch(e) {
            ConsoleWriter.warn("PreProcessor could not find buildConfig.json...");
            return;
        }
          
        let authConfig = JSON.parse(fs.readFileSync(visualPackage.buildPath(...buildConfig.authConfigPath.split("/"))).toString());
        let replacerMap = { ...buildConfig.replacerConfig, ...authConfig };
        files.forEach((filePath) => {
            PreProcessor.populatePlaceholder(replacerMap, filePath);
        });
    }

    static populatePlaceholder(replacerMap, filePath) {
        if(filePath.slice(-5) !== ".d.ts" && filePath.slice(-3) === ".ts") {        
            let content = fs.readFileSync(filePath).toString();
            content = content.replace(/##__\w+__##/gm, (match) => {
                if(replacerMap.hasOwnProperty(match)) {
                    return replacerMap[match];
                } else {
                    ConsoleWriter.warn(`Replacement for ${match} not found.`);
                    return match;
                }
            });
            fs.writeFileSync(filePath, content);      
        }
    }
}

module.exports = PreProcessor;