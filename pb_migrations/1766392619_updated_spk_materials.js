/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number1724343031",
    "max": null,
    "min": null,
    "name": "qty_out",
    "onlyInt": true,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "IN_STOCK",
      "PARTIAL_OUT"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number1724343031",
    "max": null,
    "min": null,
    "name": "qty_out",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "IN_STOCK",
      "PARTIAL_OUT"
    ]
  }))

  return app.save(collection)
})
