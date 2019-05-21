let fs = require("fs-extra");
const ConsoleWriter = require("./ConsoleWriter");


class PreProcessor {
    /**
    * Update pbviz.json contents with build properties
    * @param {VisualPackage} visualPackage
    * @param {Object} buildOptions
    */
    static getBuildOptions(visualPackage, buildOptions) {
        let preOptions = buildOptions.preProcessOptions = (buildOptions.preProcessOptions || {});
        
        if(preOptions.buildConfigFiles) {
            const files = preOptions.buildConfigFiles.split(',');
            files.reduce((mergedContent, filePath) => {
                try {
                    const contents = fs.readJsonSync(visualPackage.buildPath(...filePath.split('/')));
                    mergedContent = Object.assign(mergedContent, contents);
                } catch(err) {
                    ConsoleWriter.warn(`PreProcessor could not find ${filePath}...`);
                }                
                return mergedContent;
            }, preOptions);
        }

        PreProcessor.processPbiviz(visualPackage, preOptions);
        return buildOptions;
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {VisualPackage} visualPackage
    * @param {Object} preOptions
    */
   static processPbiviz(visualPackage, preOptions = {}) {

        // version
        if(preOptions.buildVersion) {
            visualPackage.config.visual.version = preOptions.buildVersion;
        }

        // guid
        if(preOptions.guidPrefix) {
            visualPackage.config.visual.guid = `${preOptions.guidPrefix}_${visualPackage.config.visual.guid}`;
        }

        // display name with tag 
        let displayName = visualPackage.config.visual.displayName;
        let index = displayName.indexOf('(');        
        visualPackage.config.visual.displayName = displayName.slice(0, index).trim() + ' ' + `(${visualPackage.config.visual.version} ${preOptions.tag ? `- ${preOptions.tag}` : ''})`;
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {Array} files
    * @param {Object} preOptions
    */
    static build(files, preOptions = {}) {
        files.forEach((filePath) => {
            PreProcessor.populatePlaceholder(filePath, preOptions);
        });
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {String} files
    * @param {Object} preOptions
    */
    static populatePlaceholder(filePath, preOptions = {}) {
        if(filePath.slice(-5) !== ".d.ts" && filePath.slice(-3) === ".ts") {        
            let content = fs.readFileSync(filePath).toString();
            content = content.replace(/##__\w+__##/gm, (match) => {
                const key = match.slice(4,-4);
                if(preOptions.hasOwnProperty(key)) {
                    return preOptions[key];
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