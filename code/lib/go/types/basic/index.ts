
// Common type aliases
import {BooleanTypeSpec} from "./boolean";
import {Int64TypeSpec, UInt64TypeSpec} from "./uint64";
import {DataViewableTypeSpec} from "./dataview";

export const Bool = new BooleanTypeSpec()
// FIXME: fix UInt spec definitions
export const Int = new UInt64TypeSpec('int')
export const Int64 = new Int64TypeSpec('int64')
export const Uint = new UInt64TypeSpec('uint')
export const UintPtr = new UInt64TypeSpec('uintptr')
export const Byte = new DataViewableTypeSpec('byte', 1, 1, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getUint8,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setUint8,
})

// Go stores int8 with padding because minimal supported data type by assembly is uint32.
export const Uint8 = new DataViewableTypeSpec('uint8', 1, 1, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getUint8,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setUint8,
})

export const Int8 = new DataViewableTypeSpec('int8', 1, 1, 3, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getInt8,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setInt8,
})

export const Uint32 = new DataViewableTypeSpec('uint32', 4, 4, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getUint32,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setUint32,
})

export const Int32 = new DataViewableTypeSpec('int32', 4, 4, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getInt32,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setInt32,
})

// FIXME: replace BigInt decoding with manual
export const Uint64 = new DataViewableTypeSpec('uint64', 8, 8, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getBigUint64,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setBigUint64,
})

export const Float32 = new DataViewableTypeSpec('float32', 4, 4, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getFloat32,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setFloat32,
})

export const Float64 = new DataViewableTypeSpec('float64', 8, 8, 0, {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  read: DataView.prototype.getFloat64,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  write: DataView.prototype.setFloat64,
})
