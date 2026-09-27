/**
 * XML project / asset parser and serializer for 8BIT.js
 */
export class XML {
  /**
   * Parse XML string into a plain object project structure
   */
  static parse(xmlString) {
    if (typeof DOMParser === 'undefined') {
      // Minimal fallback for non-browser
      return { error: 'DOMParser not available' };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) {
      return { error: err.textContent };
    }

    const root = doc.documentElement;
    const isSpriteOnly = root.tagName === 'spriteProject' || root.getAttribute('mode') === 'spriteOnly';

    const project = {
      name: root.getAttribute('name') || 'Untitled',
      version: root.getAttribute('version') || '1.0',
      mode: isSpriteOnly ? 'spriteOnly' : 'game',
      width: 256,
      height: 240,
      scale: 3,
      sprites: [],
      tilemaps: [],
      palettes: [],
      scenes: []
    };

    // Settings
    const settings = root.querySelector('settings');
    if (settings) {
      project.width = parseInt(settings.querySelector('width')?.textContent || '256', 10);
      project.height = parseInt(settings.querySelector('height')?.textContent || '240', 10);
      project.scale = parseInt(settings.querySelector('scale')?.textContent || '3', 10);
    } else {
      project.width = parseInt(root.getAttribute('width') || '256', 10);
      project.height = parseInt(root.getAttribute('height') || '240', 10);
    }

    // Palettes
    root.querySelectorAll('palette').forEach(pal => {
      const colors = [];
      pal.querySelectorAll('color').forEach(c => {
        colors.push(c.textContent.trim());
      });
      project.palettes.push({
        name: pal.getAttribute('name') || 'main',
        colors
      });
    });

    // Sprites
    root.querySelectorAll('sprite').forEach(sp => {
      const sprite = {
        id: sp.getAttribute('id') || 'sprite',
        x: parseFloat(sp.getAttribute('x') || '0'),
        y: parseFloat(sp.getAttribute('y') || '0'),
        width: parseInt(sp.getAttribute('width') || '16', 10),
        height: parseInt(sp.getAttribute('height') || '16', 10),
        index: parseInt(sp.getAttribute('index') || '0', 10),
        animations: []
      };
      sp.querySelectorAll('animation').forEach(an => {
        const frames = [];
        an.querySelectorAll('frame').forEach(f => {
          frames.push(f.getAttribute('src') || f.textContent.trim());
        });
        sprite.animations.push({
          name: an.getAttribute('name') || 'idle',
          fps: parseInt(an.getAttribute('fps') || '8', 10),
          loop: an.getAttribute('loop') !== 'false',
          frames
        });
      });
      project.sprites.push(sprite);
    });

    // Tilemaps
    root.querySelectorAll('tilemap').forEach(tm => {
      const map = {
        id: tm.getAttribute('id') || 'map',
        width: parseInt(tm.getAttribute('width') || '32', 10),
        height: parseInt(tm.getAttribute('height') || '30', 10),
        tileWidth: parseInt(tm.getAttribute('tileWidth') || '16', 10),
        tileHeight: parseInt(tm.getAttribute('tileHeight') || '16', 10),
        layers: []
      };
      tm.querySelectorAll('layer').forEach(l => {
        map.layers.push({ name: l.getAttribute('name') || 'layer' });
      });
      project.tilemaps.push(map);
    });

    return project;
  }

  /**
   * Serialize project object back to XML string
   */
  static stringify(project) {
    const mode = project.mode === 'spriteOnly' ? 'spriteProject' : 'project';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<${mode} name="${project.name || 'Untitled'}" version="${project.version || '1.0'}"`;
    if (project.mode === 'spriteOnly') {
      xml += ` mode="spriteOnly" width="${project.width}" height="${project.height}"`;
    }
    xml += `>\n`;

    if (project.mode !== 'spriteOnly') {
      xml += `  <settings>\n`;
      xml += `    <width>${project.width || 256}</width>\n`;
      xml += `    <height>${project.height || 240}</height>\n`;
      xml += `    <scale>${project.scale || 3}</scale>\n`;
      xml += `  </settings>\n`;
    }

    for (const pal of project.palettes || []) {
      xml += `  <palette name="${pal.name}">\n`;
      pal.colors.forEach((c, i) => {
        xml += `    <color id="${i}">${c}</color>\n`;
      });
      xml += `  </palette>\n`;
    }

    for (const sp of project.sprites || []) {
      xml += `  <sprite id="${sp.id}" width="${sp.width}" height="${sp.height}" x="${sp.x}" y="${sp.y}" index="${sp.index || 0}">\n`;
      for (const an of sp.animations || []) {
        xml += `    <animation name="${an.name}" fps="${an.fps}" loop="${an.loop}">\n`;
        for (const f of an.frames) {
          xml += `      <frame src="${f}"/>\n`;
        }
        xml += `    </animation>\n`;
      }
      xml += `  </sprite>\n`;
    }

    for (const tm of project.tilemaps || []) {
      xml += `  <tilemap id="${tm.id}" width="${tm.width}" height="${tm.height}" tileWidth="${tm.tileWidth}" tileHeight="${tm.tileHeight}">\n`;
      for (const l of tm.layers || []) {
        xml += `    <layer name="${l.name}"/>\n`;
      }
      xml += `  </tilemap>\n`;
    }

    xml += `</${mode}>\n`;
    return xml;
  }

  static load(url) {
    return fetch(url)
      .then(r => r.text())
      .then(text => XML.parse(text));
  }

  static save(project) {
    return XML.stringify(project);
  }

  static export(project) {
    return XML.stringify(project);
  }
}

export default XML;
