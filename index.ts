import {
  createApp,
  reactive,
  computed,
  unref,
  defineComponent,
  watch
} from 'vue'

const Vue = {
  createApp,
  reactive,
  computed,
  unref,
  defineComponent,
  watch
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

function forEachIterable<T, V>(iterable: Iterable<T>, mapper: (t: T, i: number) => void): void {
  let i = 0
  for (const value of iterable) {
    mapper(value, i)
    i++
  }
}

function first<T>(arr: Iterable<T>) {
  for (const i of arr) {
    return i
  }
}

function tupleFirst<T>(tuple: [T, any]) {
  return tuple[0]
}

function tupleSecond<T>(tuple: [any, T]) {
  return tuple[0]
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

function countIterable<T>(arr: Iterable<T>, condition: (t: T) => boolean = () => true) {
  let inc = 0
  for (const t of arr) {
    condition(t) && inc++
  }
  return inc
}

function existIterable<T>(arr: Iterable<T>, condition: (t: T) => boolean = () => true) {
  for (const t of arr) {
    if (condition(t)) {
      return true
    }
  }
  return false
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

const PossibleEvidenceIsEmpty = Vue.defineComponent({
  props: {
    isGhostDetermined: Boolean,
    areExclusions: Boolean,
    clearExclusions: Function as any as () => () => void,
    reset: Function as any as () => void
  },
  template: `<div v-if="isGhostDetermined" class="possible-evidence-is-empty"></div>
  <div v-else-if="areExclusions" class="possible-evidence-is-empty">
    <div>No possible evidence types remain. Maybe something was incorrectly ruled out?</div> <div @click="clearExclusions" class="btn btn-secondary">Reset excluded cases</div>
  </div>
  <div v-else class="possible-evidence-is-empty">No possible evidence types remain. <div @click="reset" class="btn btn-primary">Reset All</div></div>`
})

const GhostConclusion = Vue.defineComponent({
  props: {
    ghostDetermined: String as () => Ghost,
    isRemainingPossibleRefinedByCheckboxGhost: Boolean,
    areExclusions: Boolean,
    clearExclusions: Function as any as () => () => void,
    reset: Function as any as () => void
  },
  template: `<div v-if="ghostDetermined" class="ghost-determined-reset"><div @click="reset" class="btn btn-primary">Reset</div></div>
  <span v-else-if="isRemainingPossibleRefinedByCheckboxGhost" />
  <div v-else-if="areExclusions" class="ghost-conclusion">
    <div>No possible ghosts remain. Maybe something was incorrectly ruled out?</div>
    <div @click="clearExclusions" class="btn btn-secondary">Reset excluded cases</div>
  </div>
  <div v-else class="ghost-conclusion">No possible ghosts remain. <div @click="reset" class="btn btn-primary">Reset All</div></div>`
})

Vue.createApp(
  {
    components: {
      Cross,
      Checkmark,
      Move,
      Lock,
      PossibleEvidenceIsEmpty,
      GhostConclusion
    },
    setup() {
      const evidenceCheckState: Map<Evidence, Possible<boolean>> = Vue.reactive(new Map())

      const ghostCheckState: Map<Ghost, Possible<boolean>> = Vue.reactive(new Map())

      const possibleGhosts = Vue.computed(
        () => [...mapIterable<[Ghost, [Evidence, Evidence, Evidence]], Ghost>(
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
          tupleFirst
        )].sort(
          scalarSort(
            g => {
              const checkState = ghostCheckState.get(g)

              return checkState === true ? -1
                : checkState === false ? 1
                  : 0
            }
          )
        )
      )

      const affirmedGhosts = Vue.computed(() => [...mapIterable(
        filterIterable(
          ghostCheckState,
          ([, check]) => check === true
        ),
        tupleFirst
      )])

      const deniedGhosts = Vue.computed(() => [...mapIterable(
        filterIterable(
          ghostCheckState,
          ([, check]) => check === false
        ),
        tupleFirst
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
        () => [...mapIterable<[Evidence, boolean], Evidence>(
          filterIterable(
            evidenceCheckState,
            ([, b]) => b !== undefined
          ),
          tupleFirst
        )].sort(scalarSort(e => -Number(evidenceCheckState.get(e))))
      )

      const possibleEvidences = Vue.computed(
        () => fromIterableSorted(
          filterIterable(evidenceList, e => !Vue.unref(loggedEvidences).includes(e) && !!getOrFail(Vue.unref(evidencePossibleScenarioCount), e)),
          scalarSort(e => -getOrFail(
            Vue.unref(evidencePossibleScenarioCount),
            e
          ))
        )
      )

      const toggleGhostAffirmed = (g: Ghost) => {
        const currentState = ghostCheckState.get(g)

        if (currentState === true) {
          ghostCheckState.delete(g)
        } else {
          ghostCheckState.set(g, true)
        }
      }

      const toggleGhostDenied = (g: Ghost) => {
        const currentState = ghostCheckState.get(g)

        if (currentState === false) {
          ghostCheckState.delete(g)
        } else {
          ghostCheckState.set(g, false)
        }
      }

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

      const resetEvidence = () => {
        evidenceCheckState.clear()
      }

      const resetGhosts = () => {
        ghostCheckState.clear()
      }

      const cssClassMethods = {
        evidenceBoxClass(
          e: Evidence
        ) {
          const state = evidenceCheckState.get(e)

          return {
            'evidence-box': true,
            'evidence-box__yes': state === true,
            'evidence-box__no': state === false
          }
        },
        evidenceControlClass(
          e: Evidence,
          controlType: 'yes' | 'no' | 'clear'
        ) {
          const isActive = controlType !== 'clear' && (evidenceCheckState.get(e) === (controlType === 'yes'))

          return {
            'evidence-control': true,
            [`evidence-control__${controlType}`]: true,
            'evidence-control__active': isActive
          }
        },
        ghostBoxClass(
          g: Ghost
        ) {
          const state = ghostCheckState.get(g)

          return {
            'ghost-box': true,
            'ghost-box__rule-in': state === true,
            'ghost-box__rule-out': state === false
          }
        },
        ghostControlClass(
          g: Ghost,
          controlType: 'rule-out' | 'rule-in'
        ) {
          const isActive = ghostCheckState.get(g) === (controlType === 'rule-in')

          return {
            'ghost-control': true,
            [`ghost-control__${controlType}`]: true,
            'ghost-control__active': isActive
          }
        }
      }

      const isGhostDetermined = Vue.computed(
        () => Vue.unref(
          possibleGhostsRefinedByCheckbox
        ).length === 1
      )

      const ghostDetermined = Vue.computed(
        () => Vue.unref(
          possibleGhostsRefinedByCheckbox
        ).length === 1 ? first(Vue.unref(possibleGhostsRefinedByCheckbox)) : undefined
      )

      const areExclusions = Vue.computed(
        () => existIterable(
          evidenceCheckState,
          ([, checked]) => checked === false
        ) || existIterable(
          ghostCheckState,
          ([, checked]) => checked !== undefined
        )
      )

      const clearExclusions = () => {
        ghostCheckState.clear()
        forEachIterable(
          evidenceCheckState,
          ([e, checkState]) => (checkState === false) && evidenceCheckState.delete(
            e
          )
        )
      }

      const isRemainingPossibleRefinedByCheckboxGhost = Vue.computed(
        () => !!Vue.unref(
          possibleGhostsRefinedByCheckbox
        ).length
      )

      const article = (g: Ghost) => {
        return [
          'A',
          'E',
          'I',
          'O',
          'U'
        ].includes(g[0]) ? 'an' : 'a'
      }

      const suggestRuleIn = Vue.computed(
        () => Vue.unref(isGhostDetermined) && (ghostCheckState.get(Vue.unref(ghostDetermined)) === true) && existIterable(
          Vue.unref(possibleGhosts),
          g => g !== Vue.unref(ghostDetermined) && (ghostCheckState.get(g) !== false
          )
        )
      )

      Vue.watch(
        possibleGhosts,
        (newVal, oldVal) => {
          const newlyRuledOutByEvidence = without(
            oldVal,
            newVal
          )

          forEachIterable(
            newlyRuledOutByEvidence,
            g => ghostCheckState.delete(g)
          )

        }
      )

      return {
        article,
        possibleGhosts,
        ghostCheckState,
        evidenceCheckState,
        possibleEvidences,
        loggedEvidences,
        evidenceProbabilities,
        ghostsToEvidences,
        isGhostDetermined,
        areExclusions,
        ghostDetermined,
        isRemainingPossibleRefinedByCheckboxGhost,
        newGame,
        resetEvidence,
        resetGhosts,
        logEvidence,
        delogEvidence,
        toggleGhostAffirmed,
        toggleGhostDenied,
        uncheckGhost,
        clearExclusions,
        suggestRuleIn,
        ...cssClassMethods
      }
    },
    template: `
      <div class="container">
        <div class="row section--top">
          <div class="col">
            <h1>Phasmophobia Eliminator</h1>
            <h2>Rule out evidence and ghosts to identify your target.</h2>
          </div>
        </div>
        <div class="row section--content-top">
          <div class="col">
            <div @click="newGame" class="btn btn-primary">New game</div>
          </div>
        </div>
        <div class="row evidence--header">
          <div class="col">
            <h2>
              Evidence
            </h2>
          </div>
        </div>
        <div class="section--evidence">
          <div class="row">
            <div class="col logged-evidence">
              <div v-for="e of loggedEvidences" class="logged-evidence--item" :class="evidenceBoxClass(e)" :key="e">
                <div class="logged-evidence--name" @click="logEvidence(e, true)">{{e}}</div>
                <div class="logged-evidence--control">
                  <div @click="logEvidence(e, true)" class="logged-evidence--control-item" :class="evidenceControlClass(e, 'yes')"><Checkmark />Yes</div>
                  <div @click="logEvidence(e, false)" class="logged-evidence--control-item" :class="evidenceControlClass(e, 'no')"><Cross />No</div>
                  <div @click="delogEvidence(e)" class="logged-evidence--control-item" :class="evidenceControlClass(e, 'clear')"><Move />Clear</div>
                </div>
              </div>
            </div>
            <div class="col loggable-evidence">
              <div v-for="e of possibleEvidences" class="loggable-evidence--item" :class="evidenceBoxClass(e)" :key="e">
                <div class="loggable-evidence--info">
                  <div class="loggable-evidence--name">{{e}}</div>
                  <div class="loggable-evidence--probability">{{evidenceProbabilities.get(e)}}</div>
                </div>
                <div class="loggable-evidence--control">
                  <div @click="logEvidence(e, true)" class="loggable-evidence--control-item" :class="evidenceControlClass(e, 'yes')"><Checkmark /> Yes</div>
                  <div @click="logEvidence(e, false)" class="loggable-evidence--control-item" :class="evidenceControlClass(e, 'no')"><Cross /> No</div>
                </div>
              </div>
              <PossibleEvidenceIsEmpty
                v-if="!possibleEvidences.length"
                :isGhostDetermined="isGhostDetermined"
                :areExclusions="areExclusions"
                :clearExclusions="clearExclusions"
                :reset="newGame"
              />
            </div>
          </div>
          <div class="row">
            <div @click="resetEvidence" class="btn btn-secondary"><Move /> Clear evidence</div>
          </div>
        </div>
        <div class="row ghost--header">
          <div class="col">
            <h2 class="final--header" v-if="ghostDetermined">
              The ghost is {{article(ghostDetermined)}}<br />
              <span class="final-ghost">{{ghostDetermined}}</span><br />
              <span v-if="suggestRuleIn" class="suggest-rule-in">(…Or, you need to rule in more ghosts.)</span>
            </h2>
            <h2 v-else>
              Possible Ghosts
            </h2>
          </div>
        </div>
        <div class="section--ghosts">
          <div class="row">
            <div class="col">
              <GhostConclusion
                :ghostDetermined="ghostDetermined"
                :areExclusions="areExclusions"
                :clearExclusions="clearExclusions"
                :reset="newGame"
                :isRemainingPossibleRefinedByCheckboxGhost="isRemainingPossibleRefinedByCheckboxGhost"
              />
              <div v-for="g of possibleGhosts" class="ghost--item" :class="ghostBoxClass(g)" :key="g">
                <div class="ghost--info">
                  <div class="ghost--name">{{g}}</div>
                  <div class="ghost--evidences">
                    <div v-for="e of ghostsToEvidences.get(g)" :key="e">{{e}}</div>
                  </div>
                </div>
                <div class="ghost--control">
                  <div @click="toggleGhostDenied(g)" class="ghost--control-item" :class="ghostControlClass(g, 'rule-out')"><Cross />Rule out</div>
                  <div @click="toggleGhostAffirmed(g)" class="ghost--control-item" :class="ghostControlClass(g, 'rule-in')"><Lock />Rule in</div>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div @click="resetGhosts" class="btn btn-secondary"><Move /> Clear rules</div>
          </div>
        </div>
      </div>
    `
  }
).mount('#app')
