/**
 * Simple asset manager with cache and preload
 */
export class Assets {
  constructor() {
    this.images = new Map();
    this.xmls = new Map();
    this.fonts = new Map();
    this.loading = 0;
    this.loaded = 0;
    this.onProgress = null;
    this.onComplete = null;
  }

  loadImage(key, src) {
    if (this.images.has(key)) return Promise.resolve(this.images.get(key));
    this.loading++;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        this.loaded++;
        this.loading--;
        if (this.onProgress) this.onProgress(this.loaded, this.loaded + this.loading);
        if (this.loading === 0 && this.onComplete) this.onComplete();
        resolve(img);
      };
      img.onerror = () => {
        this.loading--;
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  getImage(key) {
    return this.images.get(key);
  }

  loadXML(key, src) {
    this.loading++;
    return fetch(src)
      .then(r => r.text())
      .then(text => {
        this.xmls.set(key, text);
        this.loaded++;
        this.loading--;
        if (this.onProgress) this.onProgress(this.loaded, this.loaded + this.loading);
        if (this.loading === 0 && this.onComplete) this.onComplete();
        return text;
      });
  }

  getXML(key) {
    return this.xmls.get(key);
  }

  async preload(list) {
    const promises = list.map(item => {
      if (item.type === 'image' || !item.type) return this.loadImage(item.key, item.src);
      if (item.type === 'xml') return this.loadXML(item.key, item.src);
      return Promise.resolve();
    });
    await Promise.all(promises);
  }

  clear() {
    this.images.clear();
    this.xmls.clear();
    this.fonts.clear();
  }
}

export default Assets;
