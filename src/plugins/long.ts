import { LONG_PLAYER } from './symbols'
import { assert } from '../shared/index'
import { Manager } from '../manager/runtime'
import { extend, ExtendEvent } from 'src/shared/eventEmitter'

interface StartOptions {
  loop?: boolean
  crossOrigin?: string
  audio?: HTMLAudioElement
}

interface Player {
  type: Symbol
  manager: Manager
  options?: StartOptions
  playing: () => boolean
  el: HTMLAudioElement | null
  pause: ExtendEvent<() => void>
  close: ExtendEvent<() => void>
  add: ExtendEvent<(url: string) => void>
  play: ExtendEvent<() => Promise<boolean>>
  mute: ExtendEvent<(val: boolean) => void>
  volume: ExtendEvent<(val: number) => void>
  forward: ExtendEvent<(val: number) => void>
}

// Use audio element load source and control audio behavior
function add(this: Player, url: string) {
  if (__DEV__) {
    assert(typeof url === 'string', 'error')
  }
  const opts = this.options || {}
  const el = (this.el = opts.audio || new Audio())

  el.src = url
  el.loop = Boolean(opts.loop)
  if (opts.crossOrigin) {
    el.crossOrigin = opts.crossOrigin
  }
  el.oncanplay = () => {
    // Alter context canplay attribute and dispatch event
    this.manager.context._canplay = true
    this.manager.context.canplay.emit()
  }
  this.add.emit(el)
}

// When call stop method，need free up resource
function close(this: Player) {
  if (this.playing()) {
    this.el?.pause()
  }
  // We don't call context close, because that's a single audio
  this.manager.context.disconnect()
  this.close.emit()
}

function play(this: Player) {
  if (this.el && this.playing()) {
    return this.el.play().then(() => {
      this.play.emit()
      return true
    })
  }
  return Promise.resolve(false)
}

function pause(this: Player) {
  if (this.playing()) {
    this.el?.pause()
    this.pause.emit()
  }
}

function volume(this: Player, val: number) {
  if (__DEV__) {
    assert(typeof val === 'number' && !Number.isNaN(val), 'Not a legal value.')
  }
}

function mute(this: Player, val: boolean) {
  if (__DEV__) {
    assert(typeof val === 'boolean', 'Not a legal value.')
  }
}

function forward(this: Player, val: number) {
  if (__DEV__) {
    assert(typeof val === 'number', 'Not a legal value.')
  }
}

function playing(this: Player) {
  return this.el ? ((this.el as unknown) as HTMLAudioElement).paused : false
}

export function Long(manager: Manager, options?: StartOptions): Player {
  return {
    manager,
    options,
    el: null,
    playing,
    type: LONG_PLAYER,
    add: extend(add),
    mute: extend(mute),
    play: extend(play),
    close: extend(close),
    pause: extend(pause),
    volume: extend(volume),
    forward: extend(forward),
  }
}
