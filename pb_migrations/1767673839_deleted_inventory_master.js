/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1746017644",
        "max": 0,
        "min": 0,
        "name": "spk_no",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text868071530",
        "max": 0,
        "min": 0,
        "name": "style",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2755091507",
        "max": 0,
        "min": 0,
        "name": "artikel",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text172692275",
        "max": 0,
        "min": 0,
        "name": "material_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
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
      },
      {
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
      },
      {
        "hidden": false,
        "id": "date1610411124",
        "max": "",
        "min": "",
        "name": "xfd_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select1655102503",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "WAITING",
          "IN-PROGRESS"
        ]
      },
      {
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
      },
      {
        "hidden": false,
        "id": "number3328281011",
        "max": null,
        "min": null,
        "name": "qty_target",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2725461099",
        "max": null,
        "min": null,
        "name": "qty_actual",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1624678591",
        "max": 0,
        "min": 0,
        "name": "verified_by",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select250649779",
        "maxSelect": 1,
        "name": "check_status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "WAITING",
          "VERIFIED"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3111028277",
        "max": 0,
        "min": 0,
        "name": "komponen_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select2671376561",
        "maxSelect": 1,
        "name": "station",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "cutting 1",
          "cutting 2",
          "cutting 3"
        ]
      }
    ],
    "id": "pbc_867860984",
    "indexes": [],
    "listRule": "",
    "name": "inventory_master",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
