import path from 'path';
import { validate } from 'schema-utils';
import { getOptions, interpolateName } from 'loader-utils';

const optionsSchema = {
    type: 'object',
    properties: {
        extension: {
            type: 'string',
        },
    },
};

function shouldModify(path, source) {
    
}

function addAutoExports(source) {
    let addition = "";

    // Find the export names
    const matches = [...source.matchAll(/export\s+?(?:default\s?|function|abstract\s?|class)+?\s([^(\s<;]*)/gm)];
    matches.map(match => {
        let name = match[1]

        if (!name || name === 'interface') {
            return;
        }

        // Add code at the end of the file to add the file to registry
        addition += `\nwindow.flreg.add('${location}${name}', ${name})`
    });

    return source + addition;
}

// Custom loader logic
export default function autoExportLoader(source) {
    const options = getOptions(this);

    validate(optionsSchema, options, {
        name: 'Flarum Webpack Loader',
    });

    var composerJsonPath = path.resolve('../composer.json');

    this.addDependency(composerJsonPath);

    // Get the type of the module to be exported
    const location = interpolateName(this, '[folder]/', {
        context: this.rootContext || this.context,
    });

    // Get the name of module to be exported
    const moduleName = interpolateName(this, '[name]', {
        context: this.rootContext || this.context,
    });

    // Don't export low level files
    if (/.*\/(admin|forum)$/.test(location) || /(index|app|compat|FlarumRegistry)$/.test(moduleName)) {
        return source;
    }

    return addAutoExports(source);
}