import {pino} from 'pino';

const logger = pino({
    name: "root",
    transport: {
        targets: [
            {target: 'pino-pretty', options: {colorize: true}},
            {target: 'pino-pretty', options: {colorize: false, destination: 'logs/latest-pretty.log', append: false, mkdir: true}},
            {target: 'pino/file', options: {destination: 'logs/latest.log', append: false, mkdir: true}}
        ]
    }
});

const childLogger =  (name: string) => logger.child({name: name});
export {logger, childLogger};