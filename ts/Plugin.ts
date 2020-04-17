module PhaserSpine {
    export interface SpineObjectFactory extends Phaser.GameObjectFactory {
        spine: (x: number, y: number, key: string, premultipliedAlpha?: boolean, scalingVariant?: string, group?: Phaser.Group) => any;
    }

    export interface SpineObjectCreator extends Phaser.GameObjectCreator {
        spine: (x: number, y: number, key: string, premultipliedAlpha?: boolean, scalingVariant?: string, group?: Phaser.Group) => any
    }

    export interface SpineCache extends Phaser.Cache {
        addSpine: (key: string, data: any) => void;
        checkSpineKey: (key: string) => any;
        removeSpine: (key: string) => any;
        getSpine: (key: string) => any;
        spine: { [key: string]: SpineCacheData };
    }

    export interface SpineLoader extends Phaser.Loader {
        spine: (key: string, url: string, scalingVariants?: string[]) => void;
        cache: SpineCache;
    }

    export interface SpineGame extends Phaser.Game {
        add: SpineObjectFactory;
        load: SpineLoader;
        cache: SpineCache;
    }

    export interface SpineCacheData {
        atlas: string;
        basePath: string;
        variants: string[];
    }

    export interface Config {
        debugRendering: boolean;
        triangleRendering: boolean;
    }

    export class SpinePlugin extends Phaser.Plugin {

        public static RESOLUTION_REGEXP: RegExp = /@(.+)x/;

        public static SPINE_NAMESPACE: string = 'spine';

        public static DEBUG: boolean = false;

        public static TRIANGLE: boolean = false;

        constructor(game: SpineGame, parent: Phaser.PluginManager) {
            super(game, parent);
        }

        public init(config: Config = <Config>{}): void {
            SpinePlugin.DEBUG = config.debugRendering || false;
            SpinePlugin.TRIANGLE = config.triangleRendering || false;

            this.addSpineCache();
            this.addSpineFactory();
            this.addSpineLoader();
        }

        private addSpineLoader() {
            (<PhaserSpine.SpineLoader>Phaser.Loader.prototype).spine = function (key: string, url: string, scalingVariants?: string[]) {
                let path: string = url.substr(0, url.lastIndexOf('.'));

                let pathonly = url.substr(0, url.lastIndexOf('/'));

                (<PhaserSpine.SpineLoader>this).text('atlas_' + SpinePlugin.SPINE_NAMESPACE + '_' + key, path + '.atlas');
                (<PhaserSpine.SpineLoader>this).json(SpinePlugin.SPINE_NAMESPACE + '_' + key, path + '.json');
                // (<PhaserSpine.SpineLoader>this).image(SpinePlugin.SPINE_NAMESPACE + key, path +'.png');

                this.onFileComplete.add((progress: number, name: string) => {
                    if (name === 'atlas_' + SpinePlugin.SPINE_NAMESPACE + '_' + key) {
                        let atlas: any = this.game.cache.getText(name);
                        var firstImageName: string = null;
                        atlas.split(/\r\n|\r|\n/).forEach(function (line: string, idx: number) {
                            if (line.length === 0 || line.indexOf(':') !== -1) {
                                return;
                            }

                            if (firstImageName === null) {
                                firstImageName = line.substr(0, line.lastIndexOf('.'));
                                this.image('spritesheet_' + SpinePlugin.SPINE_NAMESPACE + '_' + key, pathonly + '/' + line);
                            }                            
                        }.bind(this));
                    }
                })
            };
        }

        /**
         * Extends the GameObjectFactory prototype with the support of adding spine. this allows us to add spine methods to the game just like any other object:
         * game.add.spine();
         */
        private addSpineFactory() {
            (<PhaserSpine.SpineObjectFactory>Phaser.GameObjectFactory.prototype).spine = function (x: number, y: number, key: string, premultipliedAlpha: boolean = false, scalingVariant?: string, group?: Phaser.Group): Spine {
                if (group === undefined) {
                    group = this.world;
                }

                let spineObject = new Spine(this.game, x, y, key, premultipliedAlpha);

                return group.add(spineObject);
            };

            (<PhaserSpine.SpineObjectCreator>Phaser.GameObjectCreator.prototype).spine = function (x: number, y: number, key: string, premultipliedAlpha: boolean = false, scalingVariant?: string, group?: Phaser.Group): Spine {
                return new Spine(this.game, x, y, key, premultipliedAlpha);
            };
        }

        /**
         * Extends the Phaser.Cache prototype with spine properties
         */
        private addSpineCache(): void {
            //Create the cache space
            (<PhaserSpine.SpineCache>Phaser.Cache.prototype).spine = {};

            //Method for adding a spine dict to the cache space
            (<PhaserSpine.SpineCache>Phaser.Cache.prototype).addSpine = function (key: string, data: SpineCacheData) {
                this.spine[key] = data;
            };

            (<PhaserSpine.SpineCache>Phaser.Cache.prototype).checkSpineKey = function (key: string): boolean {
                if (this.spine[key]) {
                    return true;
                }
                return false;
            };

            (<PhaserSpine.SpineCache>Phaser.Cache.prototype).removeSpine = function (key: string) {
                this.game.cache.removeText('atlas_' + PhaserSpine.SpinePlugin.SPINE_NAMESPACE + '_' + key);
                this.game.cache.removeImage('spritesheet_' + PhaserSpine.SpinePlugin.SPINE_NAMESPACE + '_' + key);
                this.game.cache.removeJSON(PhaserSpine.SpinePlugin.SPINE_NAMESPACE + '_' + key);
                delete this.spine[key];
            };

            //Method for fetching a spine dict from the cache space
            (<PhaserSpine.SpineCache>Phaser.Cache.prototype).getSpine = function (key: string): SpineCacheData {
                if (!this.spine.hasOwnProperty(key)) {
                    console.warn('Phaser.Cache.getSpine: Key "' + key + '" not found in Cache.')
                }

                return this.spine[key];
            };
        }
    }
}
