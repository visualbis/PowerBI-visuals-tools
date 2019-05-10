const ConsoleWriter = require("./ConsoleWriter");
let fs = require("fs-extra");

class PreProcessor {
    static build(visualPackage, files) {

        let buildConfig;
        try {
            buildConfig = fs.readJsonSync(visualPackage.buildPath("build.json"));
        } catch(e) {
            ConsoleWriter.warn("PreProcessor could not find buildConfig.json...");
            return;
        }
          
        let authConfig = fs.readJsonSync(visualPackage.buildPath(...buildConfig.authConfigPath.split("/")));
        let envMap = { ...buildConfig.env, ...authConfig };

        files.forEach((filePath) => {
            PreProcessor.populatePlaceholder(envMap, filePath);
        });
    }

    static populatePlaceholder(envMap, filePath) {
        if(filePath.slice(-5) !== ".d.ts" && filePath.slice(-3) === ".ts") {        
            let content = fs.readFileSync(filePath).toString();
            content = content.replace(/##__\w+__##/gm, (match) => {
                if(envMap.hasOwnProperty(match)) {
                    return envMap[match];
                } else {
                    ConsoleWriter.warn(`Replacement for ${match} not found.`);
                    return match;
                }
            });
            fs.writeFileSync(filePath, content);      
        }
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {VisualPackage} visualPackage
    * @param {commander} program
    */
   static processPbiviz(visualPackage, program) {
       // guid
       if(program.pro) {
           visualPackage.config.visual.guid = `${visualPackage.config.visual.guid}_PRO`;
       }
   
       // visual version
       if(program.buildVersion) {
           visualPackage.config.visual.version = program.buildVersion;
       }
   
       // display name with tag 
       let displayName = visualPackage.config.visual.displayName;
       let index = displayName.indexOf('(');        
       visualPackage.config.visual.displayName = displayName.slice(0, index).trim() + ' ' + `(${visualPackage.config.visual.version} ${program.tag ? `- ${program.tag}` : ''})`;
   }
}

module.exports = PreProcessor;