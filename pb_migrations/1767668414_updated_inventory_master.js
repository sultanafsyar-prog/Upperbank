/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2850973131",
    "max": null,
    "min": null,
    "name": "qty_total",
    "onlyInt": true,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2344237674",
    "max": null,
    "min": null,
    "name": "qty_sisa",
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
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2850973131",
    "max": null,
    "min": null,
    "name": "qty_total",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2344237674",
    "max": null,
    "min": null,
    "name": "qty_sisa",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
