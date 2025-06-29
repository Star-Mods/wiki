export  const DATA_BASE = 'http://localhost:63342/web-wiki/src/assets/data/';

const _cache = new Map();     // Map<type:key, data>
const _promises = new Map();  // Map<type:key, Promise>

/**
 * Build a unique cache key
 */
export function makeKey(type, key) {
  return [type, key].join(":")
}

/**
 * Define how to resolve URL per type
 */
function resolveUrl(type, key) {
  switch (type) {
    case 'mods':
      const [category] = key.split(':');
      return `${DATA_BASE}${category}.json`;
    case 'mod':
      const [mod] = key.split(':');
      return `${DATA_BASE}${mod}/index.json`;
    case 'faction': {
      const [mod, faction] = key.split(':');
      return `${DATA_BASE}${mod}/race/${faction.toLowerCase()}.json`;
    }
    case 'unit': {
      const [mod, unit] = key.split(':');
      return `${DATA_BASE}${mod}/unit/${unit.toLowerCase()}.json`;
    }
    case 'upgrade': {
      const [mod, upgrade] = key.split(':');
      return `${DATA_BASE}${mod}/upgrade/${upgrade.toLowerCase()}.json`;
    }
    default:
      throw new Error(`Unknown data type: ${type}`);
  }
}

/**
 * General purpose data loader with caching and deduplication.
 * @param {'mod'|'faction'|'unit'|'upgrade'|'mods'} type
 * @param {string} key e.g. 'lotv', or 'lotv:terran', or 'lotv:marine'
 * @returns {Promise<object>} loaded JSON data
 */
export function loadData(type, ...keys) {
  let key = keys.join(":")
  const fullKey = makeKey(type, key);

  if (_cache.has(fullKey)) {
    return Promise.resolve(_cache.get(fullKey));
  }

  if (_promises.has(fullKey)) {
    return _promises.get(fullKey);
  }

  const url = resolveUrl(type, key);

  const promise = fetch(url)
    .then(res => {
      if (!res.ok){
        console.log(`Failed to load ${type} data: ${key}`);
      }
      return res.json();
    })
    .then(json => {
      _cache.set(fullKey, json);
      _promises.delete(fullKey);
      return json;
    })
    .then(json =>{
      //wait for race data to load
      if(["unit","ugrade"].includes(type)){
        console.log(type, key)
        return loadData('faction', key.split(":")[0] , json.Race).then(() => json)
      }
      return json
    })
    .catch(err => {
      _promises.delete(fullKey);
      throw err;
    });

  _promises.set(fullKey, promise);
  return promise;
}

/**
 * Optional: clear cached data
 */
export function clearCache(type = null) {
  if (type) {
    for (const key of _cache.keys()) {
      if (key.startsWith(type + ':')) _cache.delete(key);
    }
  } else {
    _cache.clear();
  }
}
