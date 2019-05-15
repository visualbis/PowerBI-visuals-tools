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

        PreProcessor.processPbiviz(visualPackage, buildOptions);
        return buildOptions;
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {VisualPackage} visualPackage
    * @param {Object} buildOptions
    */
   static processPbiviz(visualPackage, buildOptions) {
        // guid
        if(buildOptions.withGuidPrefix) {
            visualPackage.config.visual.guid = `${buildOptions.withGuidPrefix}_${visualPackage.config.visual.guid}`;
        }

        // display name with tag 
        let displayName = visualPackage.config.visual.displayName;
        let index = displayName.indexOf('(');        
        visualPackage.config.visual.displayName = displayName.slice(0, index).trim() + ' ' + `(${visualPackage.config.visual.version} ${buildOptions.tag ? `- ${buildOptions.tag}` : ''})`;
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {Array} files
    * @param {Object} preProcessOptions
    */
    static build(files, preProcessOptions = {}) {
        files.forEach((filePath) => {
            PreProcessor.populatePlaceholder(filePath, preProcessOptions);
        });
    }

    /**
    * Update pbviz.json contents with build properties
    * @param {String} files
    * @param {Object} preProcessOptions
    */
    static populatePlaceholder(filePath, preProcessOptions = {}) {
        if(filePath.slice(-5) !== ".d.ts" && filePath.slice(-3) === ".ts") {        
            let content = fs.readFileSync(filePath).toString();
            content = content.replace(/##__\w+__##/gm, (match) => {
                const key = match.slice(4,-4);
                if(preProcessOptions.hasOwnProperty(key)) {
                    return preProcessOptions[key];
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