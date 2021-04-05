import {
  createApp,
  reactive,
  computed,
  unref,
  defineComponent
} from 'vue'

const Vue = {
  createApp,
  reactive,
  computed,
  unref,
  defineComponent
}
/**/"@begin"/**/
/**
 * Imported
 */
type Possible<T> = T | undefined;

function tuple<T0, T1>(arr: [T0, T1]): [T0, T1]
function tuple<T0>(arr: [T0]): [T0]
function tuple(arr: any) {
  return arr;
}

type Reconciler<K, T, V> = (
  colliding: Possible<V>,
  incoming: T,
  key: K
) => V;

function mapCollectInto<K, T, V, P extends Map<K, V>>(
  iterable: Iterable<[K, T]>,
  seed: P,
  reconcileFn?: Reconciler<K, T, V>
): P {
  if (reconcileFn) {
    for (let [key, val] of iterable) {
      const got = seed.get(key);
      const reconciled = reconcileFn(
        got,
        val,
        key
      );
      if (reconciled === undefined) {
        seed.delete(key);
      } else if (reconciled !== got) {
        seed.set(key, reconciled);
      }
    }
  } else {
    for (let entry of iterable) {
      const [key, val] = entry;
      seed.set(key, val as unknown as V);
    }
  }

  return seed;
}

/**
 * Convert an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key, the last value to arrive at that key will overwrite the rest.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created Map. 
 */
function mapCollect<K, T>(
  iterable: Iterable<[K, T]>
): Map<K, T>
/**
 * Convert an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key, `reconcileFn` will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created Map. 
 */
function mapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
/**
 * Convert an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created Map. 
 */
function mapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return mapCollectInto(
    iterable,
    new Map<K, V>(),
    reconcileFn as any
  );
}

function* flatMap<T, V>(arr: Iterable<T>, fn: (t: T) => Iterable<V>) {
  for (let val of arr) {
    yield* fn(val);
  }
}

/**
 * Generate a Reconciler that pushes input values onto an array of previously colliding values, optionally transforming them first with a mapper.
 * 
 * @param {Function} mapFn? A function to call on the inputs.
 * @returns {Reconciler} A Reconciler that combines input values into an Array.
 */
function reconcileAppend<T, V, K>(
  mapFn?: (val: T) => unknown extends V ? T : V
): Reconciler<K, T, (unknown extends V ? T : V)[]> {
  if (mapFn) {
    return function (
      collidingValue,
      value
    ) {
      const val = mapFn(value);

      if (collidingValue === undefined) {
        return [val];
      } else {
        collidingValue.push(val);
        return collidingValue;
      }
    }
  } else {
    return function (
      collidingValue,
      value
    ) {
      if (collidingValue === undefined) {
        return [value] as (unknown extends V ? T : V)[];
      } else {
        collidingValue.push(value as (unknown extends V ? T : V));
        return collidingValue as (unknown extends V ? T : V)[];
      }
    }
  }
}

function invertBinMap<K, T>(map: Iterable<[K, T[]]>): Map<T, K[]> {
  return mapCollect(
    flatMap(
      map,
      ([key, arr]) => arr.map(t => tuple([t, key]))
    ),
    reconcileAppend()
  );
}

function* filterIterable<T>(iterable: Iterable<T>, filter: (t: T, i: number) => boolean): Iterable<T> {
  let i = 0
  for (const value of iterable) {
    if (filter(value, i)) {
      yield value
    }
    i++
  }
}

function* mapIterable<T, V>(iterable: Iterable<T>, mapper: (t: T, i: number) => V): Iterable<V> {
  let i = 0
  for (const value of iterable) {
    yield mapper(value, i)
    i++
  }
}

function first<T>(arr: [T, ...any[]]): T
function first<T>(arr: Iterable<T>) {
  for (const i of arr) {
    return i
  }
}

/**
 * Any iterable of entries, regardless of origin.
 * Note that `Map<K, V>` is in this type.
 */
type MapEnumeration<K, V> = Iterable<[K, V]>;


/**
 * Given a Map-like Iterable, produce an entry set for a new Map where each key has been mapped to a new key by calling ${mapper}.
 * 
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} mapper A function mapping the values of the Map to a transformed value.
 * @returns An iterable representing the entries of a map from key to the transformed value.
 */
function mapValues<K, T, V>(
  iterable: Iterable<[K, T]>,
  mapper: (value: T, key: K) => V
): MapEnumeration<K, V> {
  return mapIterable<[K, T], [K, V]>(iterable, ([key, val]) => [key, mapper(val, key)]);
}

/** 
 * Retrieve a value from the Map at the given key. If the key is not set, return an alternate value by calling ${substitute}.
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} substitute The function to call on `key` if the value is not present.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 */
function getOrElse<T, V, W>(
  map: Map<T, V>,
  key: T,
  substitute: (key: T) => W
) {
  if (map.has(key)) {
    return map.get(key) as V;
  } else {
    return substitute(key);
  }
}

/** 
 * Retrieve a value from the Map at the given key, throwing an error if the key was not set.
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {string | Function} error? The error to generate if the key is not present. Can be a function taking the key as a parameter, or an explicit string.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 * @throws The specified error if an error string or function is provided, a default error message if not.
 */
function getOrFail<T, V>(
  map: Map<T, V>,
  key: T,
  error?: string | ((key: T) => string)
) {
  return getOrElse(
    map,
    key,
    (key: T) => {
      throw new Error(
        typeof error === "function"
          ? error(key)
          : typeof error === "undefined"
            ? `Map has no entry "${key}"`
            : error
      );
    }
  );
}

function* without<T, K>(arr: Iterable<T>, against: Iterable<T>, keyFn: (item: T) => K = (item: T) => item as unknown as K) {
  const againstAsSet = new Set(mapIterable(against, keyFn))

  for (const item of arr) {
    const key = keyFn(item)

    if (!againstAsSet.has(key)) {
      yield item
    }
  }
}

function indexOfFirstSuperior<T>(arr: T[], el: T, fn: (a: T, b: T) => number) {
  function recurse(arr: T[], el: T, fn: (a: T, b: T) => number, offset: number): number {
    if (arr.length <= 1) {
      return (arr.length && fn(el, arr[0]) > 0) ? offset + 1 : 0
    } else {
      const recurseLeft = recurse(arr.slice(0, arr.length / 2), el, fn, offset)
      const recurseRight = recurse(arr.slice(arr.length / 2, arr.length), el, fn, offset + Math.floor(arr.length / 2))
      return recurseRight || recurseLeft
    }
  }

  return recurse(arr, el, fn, 0)
}

function insertSorted<T>(arr: T[], el: T, fn: (a: T, b: T) => number) {
  const index = indexOfFirstSuperior(arr, el, fn)
  arr.splice(index, 0, el)
  return index
}

function scalarSort<T>(fn: (t: T) => string | number) {
  return (a: T, b: T) => {
    const scalarA = fn(a)
    const scalarB = fn(b)
    if (scalarA > scalarB) {
      return 1
    } else if (scalarA < scalarB) {
      return -1
    } else {
      return 0
    }
  }
}

function fromIterableSorted<T>(iterable: Iterable<T>, sortFn: (t1: T, t2: T) => number): T[] {
  const retArr: T[] = []
  for (const item of iterable) {
    insertSorted(
      retArr,
      item,
      sortFn
    )
  }

  return retArr
}
/* End imported */
type Evidence = 'EMF 5' | 'Freezing Temperatures' | 'Ghost Orbs' | 'Spirit Box' | 'Ghost Writing' | 'Fingerprints'
type Ghost = 'Spirit' | 'Phantom' | 'Banshee' | 'Wraith' | 'Poltergeist' | 'Revenant' | 'Yurei' | 'Oni' | 'Jinn' | 'Mare' | 'Shade' | 'Demon'

const ghostsToEvidences = new Map<Ghost, [Evidence, Evidence, Evidence]>([
  ['Spirit', ['Fingerprints', 'Ghost Writing', 'Spirit Box']],
  ['Wraith', ['Freezing Temperatures', 'Spirit Box', 'Fingerprints']],
  ['Phantom', ['Freezing Temperatures', 'EMF 5', 'Ghost Orbs']],
  ['Poltergeist', ['Ghost Orbs', 'Spirit Box', 'Fingerprints']],
  ['Banshee', ['Freezing Temperatures', 'EMF 5', 'Fingerprints']],
  ['Jinn', ['Ghost Orbs', 'EMF 5', 'Spirit Box']],
  ['Mare', ['Freezing Temperatures', 'Spirit Box', 'Ghost Orbs']],
  ['Revenant', ['EMF 5', 'Fingerprints', 'Ghost Writing']],
  ['Shade', ['EMF 5', 'Ghost Orbs', 'Fingerprints']],
  ['Demon', ['Spirit Box', 'Ghost Writing', 'Freezing Temperatures']],
  ['Yurei', ['Freezing Temperatures', 'Ghost Orbs', 'Ghost Writing']],
  ['Oni', ['EMF 5', 'Spirit Box', 'Ghost Writing']]
])

const evidenceList: Evidence[] = [
  'EMF 5',
  'Spirit Box',
  'Ghost Orbs',
  'Ghost Writing',
  'Fingerprints',
  'Freezing Temperatures'
]

const evidencesToGhosts = invertBinMap(ghostsToEvidences)

const Cross = Vue.defineComponent({
  template: `
  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" class="glyph cross">
  <g>
    <g>
      <g>
        <rect x="-11.8" y="30" transform="matrix(0.7071 0.7071 -0.7071 0.7071 32 -13.2548)" width="87.7" height="4"/>
      </g>
    </g>
    <g>
      <g>
        <rect x="30" y="-11.8" transform="matrix(0.7071 0.7071 -0.7071 0.7071 32 -13.2548)" width="4" height="87.7"/>
      </g>
    </g>
  </g>
  </svg>
  `
})

const Checkmark = Vue.defineComponent({
  template: `
  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" class="glyph">
  <g>
    <g>
      <g>
        <polygon points="21.1,58.6 0.3,38.9 5.7,33.1 20.9,47.4 58.1,8.2 63.9,13.8 			"/>
      </g>
    </g>
  </g>
  </svg>
  `
})

const Move = Vue.defineComponent({
  template: `
  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" class="glyph">
  <g>
    <g>
      <path d="M64,27L37,0v13C16.1,14.1,0,31.8,0,53.7V64c5.9-14.7,20.1-25,36.5-25H37v14.6L64,27z"/>
    </g>
  </g>
  </svg>
  `
})

const Lock = Vue.defineComponent({
  template: `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
  viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" class="glyph lock">
    <g>
      <g>
        <path d="M52,24h-3v-7c0-9.4-7.6-17-17-17S15,7.6,15,17v7h-3c-2.2,0-4,1.8-4,4v32c0,2.2,1.8,4,4,4h40c2.2,0,4-1.8,4-4V28
          C56,25.8,54.2,24,52,24z M32,55L32,55c-1.1,0-2-0.9-2-2v-4.6c-1.7-1.1-2.9-3.3-1.2-5.6c0.8-1.1,2-1.8,3.3-1.8c2.2,0,3.9,1.8,3.9,4
          c0,1.4-0.9,2.6-2,3.4V53C34,54.1,33.1,55,32,55z M41,24H23v-7c0-5,4-9,9-9s9,4,9,9V24z"/>
      </g>
    </g>
  </svg>`
})

Vue.createApp(
  {
    components: {
      Cross,
      Checkmark,
      Move,
      Lock
    },
    setup() {
      const evidenceCheckState: Map<Evidence, Possible<Boolean>> = Vue.reactive(new Map())

      const ghostCheckState: Map<Ghost, Possible<Boolean>> = Vue.reactive(new Map())

      const possibleGhosts = Vue.computed(
        () => [...mapIterable(
          filterIterable(
            ghostsToEvidences,
            ([, evidences]) => {
              for (const evidence of evidenceList) {
                if (evidenceCheckState.get(evidence) && !evidences.includes(evidence)) {
                  return false
                } else if (evidenceCheckState.get(evidence) === false && evidences.includes(evidence)) {
                  return false
                }
              }

              return true
            }
          ),
          first
        )]
      )

      const affirmedGhosts = Vue.computed(() => [...mapIterable(
        filterIterable(
          ghostCheckState,
          ([, check]) => check === true
        ),
        first
      )])

      const deniedGhosts = Vue.computed(() => [...mapIterable(
        filterIterable(
          ghostCheckState,
          ([, check]) => check === false
        ),
        first
      )])

      const possibleGhostsRefinedByCheckbox = Vue.computed(
        () => {
          if (Vue.unref(affirmedGhosts).length) {
            return Vue.unref(affirmedGhosts).filter(
              g => Vue.unref(possibleGhosts).includes(g)
            )
          } else {
            return Vue.unref(possibleGhosts).filter(
              g => !Vue.unref(deniedGhosts).includes(g)
            )
          }
        }
      )

      const evidencePossibleScenarioCount = Vue.computed(
        () => mapCollect(mapIterable(
          evidencesToGhosts,
          ([evidence, ghosts]) => tuple([
            evidence,
            ghosts.filter(
              g => Vue.unref(possibleGhostsRefinedByCheckbox).includes(g)
            ).length
          ])
        ))
      )

      const evidenceProbabilities = Vue.computed(
        () => mapCollect(mapValues(
          Vue.unref(evidencePossibleScenarioCount),
          v => {
            const probability = v / (Vue.unref(possibleGhostsRefinedByCheckbox).length || 1)
            return (probability * 100).toFixed(2) + '%'
          }
        ))
      )

      const loggedEvidences = Vue.computed(
        () => [...mapIterable(
          filterIterable(
            evidenceCheckState,
            ([, b]) => b !== undefined
          ),
          first
        )]
      )

      const possibleEvidences = Vue.computed(
        () => fromIterableSorted(
          without(evidenceList, Vue.unref(loggedEvidences)),
          scalarSort(e => -getOrFail(
            Vue.unref(evidencePossibleScenarioCount),
            e
          ))
        )
      )

      const affirmGhost = (g: Ghost) => ghostCheckState.set(
        g,
        true
      )

      const denyGhost = (g: Ghost) => ghostCheckState.set(
        g,
        false
      )

      const uncheckGhost = (g: Ghost) => ghostCheckState.delete(
        g
      )

      const logEvidence = (e: Evidence, outcome: boolean) => evidenceCheckState.set(
        e,
        outcome
      )

      const delogEvidence = (e: Evidence) => evidenceCheckState.delete(e)

      const newGame = () => {
        ghostCheckState.clear()
        evidenceCheckState.clear()
      }

      return {
        possibleGhosts,
        ghostCheckState,
        evidenceCheckState,
        possibleEvidences,
        loggedEvidences,
        evidenceProbabilities,
        ghostsToEvidences,
        newGame,
        logEvidence,
        delogEvidence,
        affirmGhost,
        denyGhost,
        uncheckGhost,
      }
    },
    template: `
      <div class="container">
        <div class="row section--top">
          <div class="col">
            <div @click="newGame" class="btn btn-primary">New Game</div>
          </div>
        </div>
        <div class="row section--evidence">
          <div class="col logged-evidence">
            <div v-for="e of loggedEvidences" class="logged-evidence--item" :key="e">
              <div class="logged-evidence--name" @click="logEvidence(e, true)">{{e}}</div>
              <div class="logged-evidence--control">
                <div @click="logEvidence(e, true)" class="logged-evidence--control-item"><Checkmark />Yes</div>
                <div @click="logEvidence(e, false)" class="logged-evidence--control-item"><Cross />No</div>
                <div @click="delogEvidence(e)" class="logged-evidence--control-item"><Move />Clear</div>
              </div>
            </div>
          </div>
          <div class="col loggable--evidence">
            <div v-for="e of possibleEvidences" class="loggable-evidence--item" :key="e">
              <div class="loggable-evidence--info">
                <div class="loggable-evidence--name" @click="logEvidence(e, true)">{{e}}</div>
                <div class="loggable-evidence--probability" @click="logEvidence(e, true)">{{evidenceProbabilities.get(e)}}</div>
              </div>
              <div class="loggable-evidence--control">
                <div @click="logEvidence(e, true)" class="loggable-evidence--control-item"><Checkmark /> Yes</div>
                <div @click="logEvidence(e, false)" class="loggable-evidence--control-item"><Cross /> No</div>
              </div>
            </div>
          </div>
        </div>
        <div class="row section--ghosts">
          <div class="col">
            <div v-for="g of possibleGhosts" class="ghost--item" :key="g">
              <div class="ghost--info">
                <div class="ghost--name">{{g}}</div>
                <div class="ghost--evidences">
                  <div v-for="e of ghostsToEvidences.get(g)" :key="e">{{e}}</div>
                </div>
              </div>
              <div class="ghost--control">
                <div @click="denyGhost(g)" class="ghost--control-item"><Cross />Rule out</div>
                <div @click="affirmGhost(g)" class="ghost--control-item"><Lock />Rule in</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
).mount('#app')
