/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number4135912883",
    "max": null,
    "min": null,
    "name": "urutan_kerja",
    "onlyInt": true,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number4135912883",
    "max": null,
    "min": null,
    "name": "urutan_kerja",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
